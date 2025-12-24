"""
WebSocket Endpoint for Real-Time Call Center Notifications

This module provides WebSocket connections for real-time callback reminders
and alerts to call center agents.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List, Set
import asyncio
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for agents"""
    
    def __init__(self):
        # agent_id -> set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, agent_id: int):
        """Accept a new WebSocket connection for an agent"""
        await websocket.accept()
        async with self._lock:
            if agent_id not in self.active_connections:
                self.active_connections[agent_id] = set()
            self.active_connections[agent_id].add(websocket)
        print(f"✅ Agent {agent_id} connected. Total agents: {len(self.active_connections)}")
    
    async def disconnect(self, websocket: WebSocket, agent_id: int):
        """Remove a WebSocket connection"""
        async with self._lock:
            if agent_id in self.active_connections:
                self.active_connections[agent_id].discard(websocket)
                if not self.active_connections[agent_id]:
                    del self.active_connections[agent_id]
        print(f"🔌 Agent {agent_id} disconnected")
    
    async def send_to_agent(self, agent_id: int, message: dict):
        """Send a message to a specific agent"""
        if agent_id in self.active_connections:
            dead_connections = set()
            for ws in self.active_connections[agent_id]:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    print(f"Error sending to agent {agent_id}: {e}")
                    dead_connections.add(ws)
            
            # Clean up dead connections
            async with self._lock:
                for ws in dead_connections:
                    self.active_connections[agent_id].discard(ws)
    
    async def broadcast_all(self, message: dict):
        """Broadcast a message to all connected agents"""
        for agent_id in list(self.active_connections.keys()):
            await self.send_to_agent(agent_id, message)
    
    def get_connected_agents(self) -> List[int]:
        """Get list of connected agent IDs"""
        return list(self.active_connections.keys())


# Global connection manager
manager = ConnectionManager()


@router.websocket("/notifications/{agent_id}")
async def websocket_endpoint(websocket: WebSocket, agent_id: int):
    """
    WebSocket endpoint for agent notifications.
    
    Agents connect to receive real-time callback reminders and alerts.
    """
    await manager.connect(websocket, agent_id)
    
    # Send connection success message
    await websocket.send_json({
        "type": "CONNECTION_SUCCESS",
        "message": "Connected to notification service",
        "agent_id": agent_id,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    try:
        while True:
            # Wait for messages (or timeout for heartbeat)
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0
                )
                
                # Handle ping/pong for keepalive
                if data == "ping":
                    await websocket.send_text("pong")
                elif data == "heartbeat":
                    await websocket.send_json({
                        "type": "HEARTBEAT",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
            except asyncio.TimeoutError:
                # Send heartbeat on timeout
                try:
                    await websocket.send_json({
                        "type": "HEARTBEAT",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except:
                    break
                    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error for agent {agent_id}: {e}")
    finally:
        await manager.disconnect(websocket, agent_id)


async def check_and_notify_callbacks():
    """
    Background task to check for due callbacks and send notifications.
    
    This runs continuously and checks for callbacks due within the next 5 minutes.
    """
    from app.models.lead import Lead
    from app.core.database import SessionLocal
    
    print("🚀 Starting callback notification background task...")
    
    while True:
        try:
            db = SessionLocal()
            try:
                now = datetime.utcnow()
                window = timedelta(minutes=5)
                
                # Find callbacks due in the next 5 minutes that haven't been notified
                leads_to_notify = db.query(Lead).filter(
                    Lead.status == "CALLBACK",
                    Lead.callback_time != None,
                    Lead.callback_time <= now + window,
                    Lead.callback_completed == False,
                    Lead.callback_reminder_sent == False
                ).all()
                
                for lead in leads_to_notify:
                    # Determine urgency
                    is_overdue = lead.callback_time <= now
                    
                    # Get the assigned agent (or broadcast to all if none assigned)
                    agent_id = lead.callback_assigned_to
                    
                    notification = {
                        "type": "CALLBACK_ALERT",
                        "lead_id": lead.id,
                        "lead_name": f"{lead.first_name} {lead.last_name or ''}".strip(),
                        "lead_phone": lead.phone,
                        "callback_time": lead.callback_time.isoformat() if lead.callback_time else None,
                        "callback_notes": lead.callback_notes or "",
                        "urgency": "high" if is_overdue else "normal",
                        "message": f"📞 {'OVERDUE: ' if is_overdue else ''}Call {lead.first_name} now!",
                        "timestamp": now.isoformat()
                    }
                    
                    if agent_id:
                        await manager.send_to_agent(agent_id, notification)
                    else:
                        # Broadcast to all connected agents
                        await manager.broadcast_all(notification)
                    
                    # Mark as notified
                    lead.callback_reminder_sent = True
                    db.commit()
                    
                    print(f"📢 Sent callback notification for lead {lead.id}")
                    
            finally:
                db.close()
                
        except Exception as e:
            print(f"Error in callback notification task: {e}")
            import traceback
            traceback.print_exc()
        
        # Check every 30 seconds
        await asyncio.sleep(30)


# Export the background task starter
def start_callback_checker():
    """Start the background callback checker task"""
    asyncio.create_task(check_and_notify_callbacks())
