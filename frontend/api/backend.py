from fastapi import FastAPI

app = FastAPI()

@app.get("/api/backend")
async def backend_probe():
    return {"status": "ok", "runtime": "python", "service": "vyomrix-backend-probe"}
