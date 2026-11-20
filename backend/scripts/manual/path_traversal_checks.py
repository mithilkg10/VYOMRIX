import asyncio
import httpx

BASE_URL = "http://localhost:8000/api/v1"

async def test_path_traversal():
    print("--- Testing Path Traversal ---")
    async with httpx.AsyncClient() as client:
        # URL encoded path traversal
        payload = "..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2Fwindows%2Fwin.ini"
        res = await client.get(f"{BASE_URL}/reports/download/{payload}")
        print(f"Path Traversal Report (URL Encoded): {res.status_code}")
        if res.status_code == 200:
            print(res.text[:100])

asyncio.run(test_path_traversal())
