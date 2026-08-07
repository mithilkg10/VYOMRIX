from pydantic import BaseModel
from typing import List, Optional

class SearchResult(BaseModel):
    id: str
    type: str # 'incident', 'asset', 'rule', 'user'
    title: str
    subtitle: Optional[str] = None
    url: str

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
