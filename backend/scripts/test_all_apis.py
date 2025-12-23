#!/usr/bin/env python3
"""
Comprehensive API Testing Script for COD CRM
Tests ALL endpoints and reports status
"""

import requests
import json
from datetime import datetime, date
from typing import Dict, Any, List
import sys

BASE_URL = "http://localhost:8000/api/v1"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_status(test_name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed else f"{Colors.RED}❌ FAIL{Colors.END}"
    print(f"  {status} - {test_name}")
    if details and not passed:
        print(f"         {Colors.YELLOW}{details}{Colors.END}")

def print_section(title: str):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}  {title}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

class APITester:
    def __init__(self):
        self.token = None
        self.test_results: List[Dict[str, Any]] = []
        self.passed = 0
        self.failed = 0
    
    def record_result(self, test: str, passed: bool, details: str = ""):
        self.test_results.append({
            "test": test,
            "passed": passed,
            "details": details
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        print_status(test, passed, details)
    
    def get_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    # ============ AUTH TESTS ============
    def test_auth(self):
        print_section("AUTHENTICATION")
        
        # Test login
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": "admin@cod-crm.com", "password": "Admin123!"}
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.record_result("Login with valid credentials", bool(self.token))
            else:
                self.record_result("Login with valid credentials", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Login with valid credentials", False, str(e))
        
        # Test invalid login
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": "wrong@email.com", "password": "wrongpass"}
            )
            self.record_result("Reject invalid credentials", response.status_code == 401)
        except Exception as e:
            self.record_result("Reject invalid credentials", False, str(e))
        
        # Test get current user
        try:
            response = requests.get(f"{BASE_URL}/users/me", headers=self.get_headers())
            self.record_result("Get current user", response.status_code == 200)
        except Exception as e:
            self.record_result("Get current user", False, str(e))
    
    # ============ LEADS TESTS ============
    def test_leads(self):
        print_section("LEADS MANAGEMENT")
        
        # Get all leads
        try:
            response = requests.get(f"{BASE_URL}/leads/", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                leads_count = data.get("total", 0)
                self.record_result(f"Get all leads (Found: {leads_count})", True)
            else:
                self.record_result("Get all leads", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get all leads", False, str(e))
        
        # Create lead
        test_lead_id = None
        try:
            lead_data = {
                "first_name": "Test",
                "last_name": "API Lead",
                "phone": "+212699999999",
                "email": "test_api@test.com",
                "city": "Casablanca",
                "source": "WEBSITE",
                "product_interest": "Test Product",
                "quantity": 2
            }
            response = requests.post(
                f"{BASE_URL}/leads/",
                headers={**self.get_headers(), "Content-Type": "application/json"},
                json=lead_data
            )
            if response.status_code in [200, 201]:
                test_lead_id = response.json().get("id")
                self.record_result(f"Create new lead (ID: {test_lead_id})", True)
            else:
                self.record_result("Create new lead", False, f"Status: {response.status_code} - {response.text}")
        except Exception as e:
            self.record_result("Create new lead", False, str(e))
        
        # Get single lead
        if test_lead_id:
            try:
                response = requests.get(f"{BASE_URL}/leads/{test_lead_id}", headers=self.get_headers())
                self.record_result("Get single lead by ID", response.status_code == 200)
            except Exception as e:
                self.record_result("Get single lead by ID", False, str(e))
        
        # Update lead
        if test_lead_id:
            try:
                update_data = {"status": "CONTACTED", "notes": "API test update"}
                response = requests.put(
                    f"{BASE_URL}/leads/{test_lead_id}",
                    headers={**self.get_headers(), "Content-Type": "application/json"},
                    json=update_data
                )
                self.record_result("Update lead status", response.status_code == 200)
            except Exception as e:
                self.record_result("Update lead status", False, str(e))
        
        # Search leads
        try:
            response = requests.get(
                f"{BASE_URL}/leads/?search=Hassan",
                headers=self.get_headers()
            )
            self.record_result("Search leads by name", response.status_code == 200)
        except Exception as e:
            self.record_result("Search leads by name", False, str(e))
        
        # Filter by status
        try:
            response = requests.get(
                f"{BASE_URL}/leads/?status=NEW",
                headers=self.get_headers()
            )
            self.record_result("Filter leads by status", response.status_code == 200)
        except Exception as e:
            self.record_result("Filter leads by status", False, str(e))
        
        # Delete lead (cleanup)
        if test_lead_id:
            try:
                response = requests.delete(
                    f"{BASE_URL}/leads/{test_lead_id}",
                    headers=self.get_headers()
                )
                self.record_result("Delete lead", response.status_code in [200, 204])
            except Exception as e:
                self.record_result("Delete lead", False, str(e))
    
    # ============ ORDERS TESTS ============
    def test_orders(self):
        print_section("ORDERS MANAGEMENT")
        
        # Get all orders
        try:
            response = requests.get(f"{BASE_URL}/orders/", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                orders_count = len(data) if isinstance(data, list) else data.get("total", 0)
                self.record_result(f"Get all orders (Found: {orders_count})", True)
            else:
                self.record_result("Get all orders", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get all orders", False, str(e))
        
        # Get order stats
        try:
            response = requests.get(f"{BASE_URL}/orders/stats/summary", headers=self.get_headers())
            if response.status_code == 200:
                stats = response.json()
                self.record_result(f"Get order stats (Total: {stats.get('total_orders', 0)})", True)
            else:
                self.record_result("Get order stats", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get order stats", False, str(e))
        
        # Get single order
        try:
            response = requests.get(f"{BASE_URL}/orders/1", headers=self.get_headers())
            self.record_result("Get single order by ID", response.status_code in [200, 404])
        except Exception as e:
            self.record_result("Get single order by ID", False, str(e))
        
        # Filter orders by status
        try:
            response = requests.get(
                f"{BASE_URL}/orders/?status=DELIVERED",
                headers=self.get_headers()
            )
            self.record_result("Filter orders by status", response.status_code == 200)
        except Exception as e:
            self.record_result("Filter orders by status", False, str(e))
    
    # ============ PRODUCTS TESTS ============
    def test_products(self):
        print_section("PRODUCTS/INVENTORY")
        
        # Get all products
        try:
            response = requests.get(f"{BASE_URL}/products/", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                products = data if isinstance(data, list) else data.get("products", [])
                count = len(products) if isinstance(products, list) else 0
                self.record_result(f"Get all products (Found: {count})", True)
            else:
                self.record_result("Get all products", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get all products", False, str(e))
        
        # Get product stats
        try:
            response = requests.get(f"{BASE_URL}/products/stats", headers=self.get_headers())
            if response.status_code == 200:
                stats = response.json()
                self.record_result(f"Get product stats", True)
            else:
                self.record_result("Get product stats", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get product stats", False, str(e))
        
        # Get categories
        try:
            response = requests.get(f"{BASE_URL}/products/categories", headers=self.get_headers())
            self.record_result("Get categories", response.status_code == 200)
        except Exception as e:
            self.record_result("Get categories", False, str(e))
    
    # ============ FINANCIAL TESTS ============
    def test_financial(self):
        print_section("FINANCIAL")
        
        # Get financial summary
        try:
            response = requests.get(f"{BASE_URL}/financial/summary", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                revenue = data.get("total_revenue", 0)
                self.record_result(f"Get financial summary (Revenue: {revenue} MAD)", True)
            else:
                self.record_result("Get financial summary", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get financial summary", False, str(e))
        
        # Get revenue by day
        try:
            response = requests.get(f"{BASE_URL}/financial/revenue-by-day", headers=self.get_headers())
            self.record_result("Get revenue by day", response.status_code == 200)
        except Exception as e:
            self.record_result("Get revenue by day", False, str(e))
        
        # Get monthly comparison
        try:
            response = requests.get(f"{BASE_URL}/financial/monthly-comparison", headers=self.get_headers())
            self.record_result("Get monthly comparison", response.status_code == 200)
        except Exception as e:
            self.record_result("Get monthly comparison", False, str(e))
    
    # ============ UNIT ECONOMICS TESTS ============
    def test_unit_economics(self):
        print_section("UNIT ECONOMICS")
        
        # Get unit economics summary
        try:
            response = requests.get(f"{BASE_URL}/unit-economics/summary", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                cpl = data.get("cpl", {}).get("value", 0)
                cpd = data.get("cpd", {}).get("value", 0)
                self.record_result(f"Get unit economics (CPL: {cpl}, CPD: {cpd})", True)
            else:
                self.record_result("Get unit economics", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get unit economics", False, str(e))
        
        # Get CPL
        try:
            response = requests.get(f"{BASE_URL}/unit-economics/cpl", headers=self.get_headers())
            self.record_result("Get CPL metric", response.status_code == 200)
        except Exception as e:
            self.record_result("Get CPL metric", False, str(e))
        
        # Get CPD
        try:
            response = requests.get(f"{BASE_URL}/unit-economics/cpd", headers=self.get_headers())
            self.record_result("Get CPD metric", response.status_code == 200)
        except Exception as e:
            self.record_result("Get CPD metric", False, str(e))
    
    # ============ COST SETTINGS TESTS ============
    def test_cost_settings(self):
        print_section("COST SETTINGS")
        
        # Get cost settings
        try:
            response = requests.get(f"{BASE_URL}/cost-settings/", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                shipping = data.get("default_shipping_cost", 0)
                self.record_result(f"Get cost settings (Shipping: {shipping} MAD)", True)
            else:
                self.record_result("Get cost settings", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get cost settings", False, str(e))
    
    # ============ AD SPEND TESTS ============
    def test_ad_spend(self):
        print_section("AD SPEND")
        
        # Get ad spend
        try:
            response = requests.get(f"{BASE_URL}/ad-spend/", headers=self.get_headers())
            self.record_result("Get ad spend records", response.status_code == 200)
        except Exception as e:
            self.record_result("Get ad spend records", False, str(e))
        
        # Get ad spend summary
        try:
            response = requests.get(f"{BASE_URL}/ad-spend/summary", headers=self.get_headers())
            self.record_result("Get ad spend summary", response.status_code == 200)
        except Exception as e:
            self.record_result("Get ad spend summary", False, str(e))
    
    # ============ USERS TESTS ============
    def test_users(self):
        print_section("USERS")
        
        # Get all users
        try:
            response = requests.get(f"{BASE_URL}/users/", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                users = data if isinstance(data, list) else data.get("users", [])
                count = len(users) if isinstance(users, list) else 0
                self.record_result(f"Get all users (Found: {count})", True)
            else:
                self.record_result("Get all users", False, f"Status: {response.status_code}")
        except Exception as e:
            self.record_result("Get all users", False, str(e))
    
    # ============ ANALYTICS TESTS ============
    def test_analytics(self):
        print_section("ANALYTICS")
        
        # Get analytics stats (Dashboard)
        try:
            response = requests.get(f"{BASE_URL}/analytics/dashboard", headers=self.get_headers())
            self.record_result("Get analytics dashboard stats", response.status_code == 200)
        except Exception as e:
            self.record_result("Get analytics dashboard stats", False, str(e))
        
        # Get revenue over time
        try:
            response = requests.get(f"{BASE_URL}/analytics/revenue-over-time", headers=self.get_headers())
            self.record_result("Get revenue over time", response.status_code == 200)
        except Exception as e:
            self.record_result("Get revenue over time", False, str(e))
    
    # ============ CALL NOTES TESTS ============
    def test_call_notes(self):
        print_section("CALL NOTES")
        
        # Get call notes
        try:
            response = requests.get(f"{BASE_URL}/calls/", headers=self.get_headers())
            self.record_result("Get call notes", response.status_code == 200)
        except Exception as e:
            self.record_result("Get call notes", False, str(e))
        
        # Get focus queue
        try:
            response = requests.get(f"{BASE_URL}/calls/focus-queue", headers=self.get_headers())
            self.record_result("Get focus queue", response.status_code == 200)
        except Exception as e:
            self.record_result("Get focus queue", False, str(e))
        
        # Get call stats
        try:
            response = requests.get(f"{BASE_URL}/calls/stats", headers=self.get_headers())
            self.record_result("Get call stats", response.status_code == 200)
        except Exception as e:
            self.record_result("Get call stats", False, str(e))
    
    def run_all_tests(self):
        print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BLUE}  COD CRM - COMPREHENSIVE API TEST SUITE{Colors.END}")
        print(f"{Colors.BLUE}  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
        print(f"{Colors.BLUE}{'='*60}{Colors.END}")
        
        # Run all test suites
        self.test_auth()
        self.test_leads()
        self.test_orders()
        self.test_products()
        self.test_financial()
        self.test_unit_economics()
        self.test_cost_settings()
        self.test_ad_spend()
        self.test_users()
        self.test_analytics()
        self.test_call_notes()
        
        # Print summary
        print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BLUE}  TEST SUMMARY{Colors.END}")
        print(f"{Colors.BLUE}{'='*60}{Colors.END}")
        
        total = self.passed + self.failed
        pass_rate = (self.passed / total * 100) if total > 0 else 0
        
        print(f"\n  Total Tests: {total}")
        print(f"  {Colors.GREEN}Passed: {self.passed}{Colors.END}")
        print(f"  {Colors.RED}Failed: {self.failed}{Colors.END}")
        print(f"  Pass Rate: {pass_rate:.1f}%")
        
        if pass_rate >= 90:
            print(f"\n  {Colors.GREEN}🎉 EXCELLENT! System is ready for production!{Colors.END}")
        elif pass_rate >= 70:
            print(f"\n  {Colors.YELLOW}⚠️ GOOD, but some issues need attention.{Colors.END}")
        else:
            print(f"\n  {Colors.RED}❌ CRITICAL: Many tests failed. Review before deployment.{Colors.END}")
        
        return self.failed == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
