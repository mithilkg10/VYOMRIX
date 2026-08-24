from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class HuntQueryRequest(BaseModel):
    query: str
    target_hosts: Optional[List[str]] = None
    timeout_seconds: int = 60

class HuntResultItem(BaseModel):
    host: str
    matched_data: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class HuntQueryResponse(BaseModel):
    query_id: str
    status: str
    results: List[HuntResultItem] = []
