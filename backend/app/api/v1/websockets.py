"""
WebSocket endpoint for real-time agent notifications
"""

from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import json


class ConnectionManager:
    """Manage WebSocket connections"""
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}
    
    async def connect(self, agent_id: int, websocket: WebSocket):
        """Accept and store connection"""
        await websocket.accept()
        self.active_connections[agent_id] = websocket
        print(f"✅ Agent {agent_id} connected to WebSocket")
    
    def disconnect(self, agent_id: int):
        """Remove connection"""
        if agent_id in self.active_connections:
            del self.active_connections[agent_id]
            print(f"❌ Agent {agent_id} disconnected")
    
    async def send_message(self, agent_id: int, message: dict):
        """Send message to specific agent"""
        if agent_id in self.active_connections:
            try:
                await self.active_connections[agent_id].send_json(message)
            except:
                self.disconnect(agent_id)
    
    async def broadcast(self, message: dict):
        """Send message to all connected agents"""
        for agent_id, websocket in list(self.active_connections.items()):
            try:
                await websocket.send_json(message)
            except:
                self.disconnect(agent_id)


# Global connection manager
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, agent_id: int):
    """
    WebSocket endpoint for agent notifications
    Route: /ws/notifications/{agent_id}
    """
    await manager.connect(agent_id, websocket)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "CONNECTION_SUCCESS",
            "message": f"Connected as Agent {agent_id}",
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep connection alive and listen for messages
        while True:
            try:
                # Wait for incoming messages (or timeout after 30s)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0
                )
                
                # Handle ping/pong or other messages
                if data == "ping":
                    await websocket.send_json({
                        "type": "PONG",
                        "timestamp": datetime.now().isoformat()
                    })
                    
            except asyncio.TimeoutError:
                # Send keep-alive ping every 30 seconds
                try:
                    await websocket.send_json({
                        "type": "HEARTBEAT",
                        "timestamp": datetime.now().isoformat()
                    })
                except:
                    break
                    
    except WebSocketDisconnect:
        manager.disconnect(agent_id)
    except Exception as e:
        print(f"WebSocket error for agent {agent_id}: {e}")
        manager.disconnect(agent_id)


# Helper function to send callback alerts
async def send_callback_alert(agent_id: int, lead_data: dict):
    """Send a callback alert to specific agent"""
    await manager.send_message(agent_id, {
        "type": "CALLBACK_ALERT",
        "lead_id": lead_data.get("id"),
        "lead_name": lead_data.get("name"),
        "lead_phone": lead_data.get("phone"),
        "callback_time": lead_data.get("callback_time"),
        "callback_notes": lead_data.get("callback_notes"),
        "urgency": lead_data.get("urgency", "normal"),
        "message": f"📞 Time to call {lead_data.get('name')}!",
        "timestamp": datetime.now().isoformat()
    })


# Helper function to broadcast new lead notification
async def broadcast_new_lead(lead_data: dict):
    """Broadcast new lead to all agents"""
    await manager.broadcast({
        "type": "NEW_LEAD",
        "lead_id": lead_data.get("id"),
        "lead_name": lead_data.get("name"),
        "message": "New lead added!",
        "timestamp": datetime.now().isoformat()
    })


# Background task for callback notifications
async def check_callbacks_background_task():
    """
    Background task that checks for due callbacks every 30 seconds
    and sends notifications to connected agents.
    """
    from app.core.database import SessionLocal
    from app.models.lead import Lead
    from datetime import timedelta
    
    print("🔔 Starting callback notification background task...")
    
    while True:
        try:
            db = SessionLocal()
            try:
                now = datetime.utcnow()
                window = timedelta(minutes=5)  # Check 5 minutes ahead
                
                # DEBUG: Log all leads with callback_time
                all_with_callback = db.query(Lead).filter(Lead.callback_time != None).count()
                print(f"📊 DEBUG: {all_with_callback} leads have callback_time set")
                
                # Find callbacks due in the next 5 minutes that haven't been notified
                leads_to_notify = db.query(Lead).filter(
                    Lead.callback_time != None,
                    Lead.callback_time <= now + window,
                    Lead.callback_completed == False,
                    Lead.callback_reminder_sent == False
                ).all()
                
                print(f"📊 DEBUG: {len(leads_to_notify)} leads need notification (due within 5 min, not sent yet)")
                
                for lead in leads_to_notify:
                    is_overdue = lead.callback_time <= now
                    
                    lead_data = {
                        "id": lead.id,
                        "name": f"{lead.first_name} {lead.last_name or ''}".strip(),
                        "phone": lead.phone,
                        "callback_time": lead.callback_time.isoformat() if lead.callback_time else None,
                        "callback_notes": lead.callback_notes or "",
                        "urgency": "high" if is_overdue else "normal"
                    }
                    
                    # Send to assigned agent or broadcast to all
                    if lead.callback_assigned_to:
                        await send_callback_alert(lead.callback_assigned_to, lead_data)
                    else:
                        # Broadcast to all connected agents
                        await manager.broadcast({
                            "type": "CALLBACK_ALERT",
                            **lead_data,
                            "message": f"📞 {'OVERDUE: ' if is_overdue else ''}Call {lead_data['name']} now!",
                            "timestamp": now.isoformat()
                        })
                    
                    # Mark as notified
                    lead.callback_reminder_sent = True
                    db.commit()
                    
                    print(f"📢 Sent callback notification for lead {lead.id} ({lead_data['name']})")
                    
            finally:
                db.close()
                
        except Exception as e:
            print(f"Error in callback notification task: {e}")
            import traceback
            traceback.print_exc()
        
        # Check every 30 seconds
        await asyncio.sleep(30)


def start_callback_checker():
    """Start the background callback checker task"""
    asyncio.create_task(check_callbacks_background_task())

