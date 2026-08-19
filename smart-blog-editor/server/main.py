from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_db
from routers import auth, posts, websocket, ai

app = FastAPI(
    title="Smart Blog Editor API",
    description="Real-Time Collaborative CRDT & AI Copilot Backend",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on Startup
init_db()

# Mount Routers
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(websocket.router)
app.include_router(ai.router)

@app.get("/")
async def root():
    return {"message": "Smart Blog Editor API is running (Modular Architecture)"}