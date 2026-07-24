import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_auth_failures():
    print("--- Testing Auth Failures ---")
    async with httpx.AsyncClient() as client:
        # 1. SQL Injection on login
        res = await client.post(f"{BASE_URL}/auth/login", data={"username": "admin' OR '1'='1", "password": "password"})
        print(f"SQLi Login: {res.status_code}")
        
        # 2. Huge payload on login
        huge_string = "A" * 1000000
        res = await client.post(f"{BASE_URL}/auth/login", data={"username": huge_string, "password": "password"})
        print(f"Huge Payload Login: {res.status_code}")
        
        # 3. Missing fields
        res = await client.post(f"{BASE_URL}/auth/login", data={})
        print(f"Missing fields Login: {res.status_code}")

async def test_rbac_bypass(token: str):
    print("--- Testing RBAC Bypass ---")
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # Analyst trying to register a new user (requires users:manage)
        res = await client.post(
            f"{BASE_URL}/auth/register", 
            json={"email": "hacked@vyomrix.com", "password": "hack", "full_name": "Hack", "role": "Super Admin"},
            headers=headers
        )
        print(f"Analyst -> Register User: {res.status_code} {res.text}")

async def test_api_robustness(token: str):
    print("--- Testing API Robustness ---")
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        # 1. POST incident with malformed JSON
        res = await client.post(
            f"{BASE_URL}/incidents/", 
            content="{'title': 'broken JSON'",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        print(f"Malformed JSON Incident POST: {res.status_code}")
        
        # 2. POST incident with XSS
        res = await client.post(
            f"{BASE_URL}/incidents/", 
            json={"title": "<script>alert(1)</script>", "description": "XSS test", "severity": "High"},
            headers=headers
        )
        print(f"XSS Incident POST: {res.status_code}")
        
        # 3. Path traversal on report download
        res = await client.get(f"{BASE_URL}/reports/download/../../../../etc/passwd")
        print(f"Path Traversal Report: {res.status_code}")

async def main():
    # Attempt to login as analyst to get a token
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{BASE_URL}/auth/login", data={"username": "analyst@vyomrix.com", "password": "vyomrix_analyst"})
        if res.status_code == 200:
            token = res.json().get("access_token")
            await test_auth_failures()
            await test_rbac_bypass(token)
            await test_api_robustness(token)
        else:
            print("Failed to get analyst token")

asyncio.run(main())
