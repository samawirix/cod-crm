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
        "message": f"Time to call {lead_data.get('name')}!",
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
