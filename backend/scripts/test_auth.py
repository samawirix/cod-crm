"""
Test Authentication Script
"""

import requests
import json
import sys
import os

BASE_URL = "http://localhost:8000"

def test_login():
    print("=" * 60)
    print("TESTING LOGIN")
    print("=" * 60)
    
    credentials = {
        "email": "admin@cod-crm.com",
        "password": "Admin123!"
    }
    
    print(f"\n📤 POST {BASE_URL}/api/v1/auth/login")
    print(f"📧 Email: {credentials['email']}")
    print(f"🔑 Password: {credentials['password']}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json=credentials,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📥 Status: {response.status_code}")
        print(f"📦 Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ LOGIN SUCCESSFUL!")
            token = response.json().get("access_token")
            if token:
                print(f"🎫 Token: {token[:50]}...")
            return token
        else:
            print(f"\n❌ LOGIN FAILED!")
            print(f"Error: {response.json()}")
            return None
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_login()

