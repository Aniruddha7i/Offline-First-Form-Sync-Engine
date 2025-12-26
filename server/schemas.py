from pydantic import BaseModel
from typing import List, Optional, Literal

class Operation(BaseModel):
    opId: str
    entityId: str
    type: Literal['CREATE', 'UPDATE', 'DELETE']
    payload: Optional[dict] = None
    timestamp: str 
    baseVersion: Optional[int] = None

class SyncRequest(BaseModel):
    clientId: str
    operations: List[Operation]

class ItemSchema(BaseModel):
    id: str
    title: str
    description: str
    updatedAt: str
    version: int

class Conflict(BaseModel):
    entityId: str
    reason: str

class SyncResponse(BaseModel):
    acknowledgedOps: List[str]
    serverState: List[ItemSchema]
    conflicts: List[Conflict]