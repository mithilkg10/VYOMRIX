import asyncio
import httpx
import time
import os
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

async def authenticate(client):
    email = os.getenv("BENCHMARK_EMAIL")
    password = os.getenv("BENCHMARK_PASSWORD")
    if not email or not password:
        raise RuntimeError("Set BENCHMARK_EMAIL and BENCHMARK_PASSWORD before running the benchmark.")

    res = await client.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    raise Exception(f"Auth failed: {res.text}")

async def fetch_incidents(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    start = time.perf_counter()
    res = await client.get(f"{BASE_URL}/incidents/", headers=headers)
    latency = (time.perf_counter() - start) * 1000
    return latency, res.status_code

async def run_benchmark(num_requests=100):
    async with httpx.AsyncClient() as client:
        try:
            token = await authenticate(client)
        except Exception as e:
            print(f"Skipping benchmark: {e}")
            return
            
        print(f"\nStarting {num_requests} concurrent requests to /incidents/...")
        
        start_total = time.perf_counter()
        
        # Fire requests in batches to avoid socket exhaustion on Windows
        batch_size = 50
        latencies = []
        for i in range(0, num_requests, batch_size):
            tasks = [fetch_incidents(client, token) for _ in range(min(batch_size, num_requests - i))]
            results = await asyncio.gather(*tasks)
            latencies.extend([r[0] for r in results if r[1] == 200])
        
        total_time = time.perf_counter() - start_total
        
        if not latencies:
            print("No successful requests.")
            return
            
        latencies.sort()
        
        p50 = latencies[int(len(latencies) * 0.50)]
        p95 = latencies[int(len(latencies) * 0.95)]
        p99 = latencies[int(len(latencies) * 0.99)]
        max_lat = latencies[-1]
        throughput = len(latencies) / total_time
        
        print(f"Total Requests: {num_requests}")
        print(f"Successful: {len(latencies)}")
        print(f"Total Time: {total_time:.2f}s")
        print(f"Throughput: {throughput:.2f} req/s")
        print(f"P50 Latency: {p50:.2f} ms")
        print(f"P95 Latency: {p95:.2f} ms")
        print(f"P99 Latency: {p99:.2f} ms")
        print(f"Max Latency: {max_lat:.2f} ms")

if __name__ == "__main__":
    for level in [100, 500, 1000]:
        asyncio.run(run_benchmark(level))
