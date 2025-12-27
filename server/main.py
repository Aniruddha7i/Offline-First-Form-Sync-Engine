from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import ItemDB, ProcessedOpDB
from schemas import SyncRequest, SyncResponse, ItemSchema, Conflict
import os

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Setup (Allow Frontend to talk to Backend)
# We use the environment variable, but fallback to your specific Vercel URL for safety
origins = os.getenv("ALLOWED_ORIGINS", "https://offline-first-form-sync-engine04.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SiteMaster Sync Engine is Running!"}

@app.post("/sync", response_model=SyncResponse)
def sync(request: SyncRequest, db: Session = Depends(get_db)):
    acknowledged_ops = []
    conflicts = []
    
    # 1. Process Operations
    for op in request.operations:
        # Idempotency Check
        if db.query(ProcessedOpDB).filter_by(opId=op.opId).first():
            acknowledged_ops.append(op.opId)
            continue

        item = db.query(ItemDB).filter_by(id=op.entityId).first()

        try:
            if op.type == "CREATE":
                if item:
                    # If exists but not deleted, treat as update
                    if not item.deleted:
                        item.title = op.payload.get('title', item.title)
                        item.description = op.payload.get('description', item.description)
                        item.updatedAt = op.timestamp
                        item.version += 1
                else:
                    new_item = ItemDB(
                        id=op.entityId,
                        title=op.payload['title'],
                        description=op.payload['description'],
                        updatedAt=op.timestamp,
                        version=1,
                        deleted=False
                    )
                    db.add(new_item)

            elif op.type == "UPDATE":
                if not item:
                    conflicts.append(Conflict(entityId=op.entityId, reason="Item not found"))
                elif item.deleted:
                    conflicts.append(Conflict(entityId=op.entityId, reason="Cannot update deleted item"))
                else:
                    item.title = op.payload.get('title', item.title)
                    item.description = op.payload.get('description', item.description)
                    item.updatedAt = op.timestamp
                    item.version += 1

            elif op.type == "DELETE":
                if item and not item.deleted:
                    item.deleted = True
                    item.updatedAt = op.timestamp
                    item.version += 1

            db.add(ProcessedOpDB(opId=op.opId))
            acknowledged_ops.append(op.opId)
            db.commit()

        except Exception as e:
            db.rollback()
            print(f"Error: {e}")

    # 2. Fetch Authoritative State
    server_items = db.query(ItemDB).filter(ItemDB.deleted == False).all()
    
    return SyncResponse(
        acknowledgedOps=acknowledged_ops,
        serverState=[ItemSchema(id=i.id, title=i.title, description=i.description, updatedAt=i.updatedAt, version=i.version) for i in server_items],
        conflicts=conflicts
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)