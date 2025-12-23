#!/usr/bin/env python3
"""
Test script for User Management API
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_users():
    print("=" * 60)
    print("TESTING USER MANAGEMENT API")
    print("=" * 60)
    
    # Try to login as admin
    print("\n🔐 Logging in as admin...")
    login = requests.post(f"{BASE_URL}/auth/api/v1/auth/login", data={
        "username": "admin@example.com",
        "password": "admin123"
    })
    
    if login.status_code == 200:
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful!")
    else:
        print("⚠️  Login failed, testing without auth...")
        headers = {}
    
    # Get current user
    print("\n👤 Current User...")
    r = requests.get(f"{BASE_URL}/users/me", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        user = r.json()
        print(f"   ✅ Logged in as: {user.get('full_name')} ({user.get('role')})")
    else:
        print(f"   Result: {r.text[:100]}")
    
    # Get all users
    print("\n👥 All Users...")
    r = requests.get(f"{BASE_URL}/users/", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   ✅ Total users: {data['total']}")
        for u in data['users']:
            status = '🟢' if u['is_active'] else '🔴'
            print(f"      {status} {u['full_name']} ({u['role']}) - {u['email']}")
    else:
        print(f"   Result: {r.text[:100]}")
    
    # Get agents
    print("\n🎧 Get Agents...")
    r = requests.get(f"{BASE_URL}/users/agents", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        agents = r.json().get("agents", [])
        print(f"   ✅ Active agents: {len(agents)}")
        for a in agents:
            print(f"      - {a['name']} ({a['role']})")
    else:
        print(f"   Result: {r.text[:100]}")
    
    # Create new user
    print("\n➕ Create New User...")
    r = requests.post(f"{BASE_URL}/users/", json={
        "email": "newagent@example.com",
        "password": "newagent123",
        "full_name": "New Agent",
        "role": "agent"
    }, headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   ✅ Created: {r.json()['full_name']}")
    elif r.status_code == 400:
        print(f"   ⏭️  User already exists")
    else:
        print(f"   Result: {r.text[:100]}")
    
    # Get user by ID
    print("\n🔍 Get User by ID (1)...")
    r = requests.get(f"{BASE_URL}/users/1", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        user = r.json()
        print(f"   ✅ Found: {user['full_name']} ({user['role']})")
    else:
        print(f"   Result: {r.text[:100]}")
    
    # Get user performance
    print("\n📊 Get User Performance...")
    r = requests.get(f"{BASE_URL}/users/1/performance", headers=headers)
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        perf = r.json()
        print(f"   ✅ User: {perf['user_name']}")
        print(f"      Leads: {perf['leads']['total']} (Converted: {perf['leads']['converted']})")
        print(f"      Calls: {perf['calls']['total']}")
        print(f"      Orders: {perf['orders']['total']}")
    else:
        print(f"   Result: {r.text[:100]}")
    
    print("\n" + "=" * 60)
    print("✅ USER MANAGEMENT TESTS COMPLETED!")
    print("=" * 60)
    print("\n📌 Available Endpoints:")
    print("   GET  /users/          - List all users")
    print("   GET  /users/me        - Get current user")
    print("   GET  /users/agents    - Get all agents")
    print("   GET  /users/{id}      - Get user by ID")
    print("   GET  /users/{id}/performance - User performance")
    print("   POST /users/          - Create user")
    print("   PUT  /users/me        - Update current user")
    print("   PUT  /users/{id}      - Update user")
    print("   POST /users/me/change-password - Change password")
    print("   POST /users/{id}/reset-password - Reset password (admin)")
    print("   POST /users/{id}/activate - Activate user")
    print("   POST /users/{id}/deactivate - Deactivate user")


if __name__ == "__main__":
    test_users()
