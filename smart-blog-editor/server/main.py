from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import sqlite3
import json
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# ... imports ...
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user, 
    Token, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

# --- Config ---
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SQLite Database Setup ---
DB_FILE = "blog.db"

def init_db():
    """Create tables if they don't exist"""
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        # Posts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                title TEXT,
                content TEXT,
                status TEXT,
                created_at TEXT,
                updated_at TEXT,
                author_username TEXT
            )
        ''')
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password_hash TEXT
            )
        ''')
        conn.commit()

init_db() # Run immediately on startup

# --- Models ---
class PostCreate(BaseModel):
    title: str
    content: Any 
    status: str = "draft"

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Any] = None
    status: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class AIRequest(BaseModel):
    text: str
    prompt_type: str = "summary" # summary, grammar, etc.

# --- Auth Endpoints ---

@app.post("/register", status_code=201)
async def register(user: UserCreate):
    hashed_pass = get_password_hash(user.password)
    try:
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", 
                           (user.username, hashed_pass))
            conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
    return {"message": "User created successfully"}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE username = ?", (user.username,))
        row = cursor.fetchone()
    
    if not row or not verify_password(user.password, row[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- AI Endpoint ---

@app.post("/api/ai/generate")
async def generate_ai(request: AIRequest):
    api_key = os.getenv("GENAI_API_KEY")
    
    if not api_key:
        return {"generated_text": "[MOCK AI - No Key] Please add GENAI_API_KEY to .env"}

    # Prompt construction
    prompt_text = ""
    if request.prompt_type == "summary":
        prompt_text = f"Summarize this text in 2 sentences:\n{request.text}"
    elif request.prompt_type == "grammar":
        prompt_text = f"Fix grammar and improve these sentences:\n{request.text}"
    else:
        prompt_text = request.text

    # Try using SDK if available
    if HAS_GENAI:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt_text)
            return {"generated_text": response.text}
        except Exception as e:
            print(f"SDK Error: {e}, falling back to REST API")
    
    # Fallback to REST API (using requests)
    try:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt_text}]
            }]
        }
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"API Error: {response.text}")
            raise HTTPException(status_code=500, detail=f"AI Provider Error: {response.text}")
            
        result = response.json()
        # Parse Gemini REST response structure
        generated_content = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        if not generated_content:
             return {"generated_text": "[AI] Could not generate response."}
             
        return {"generated_text": generated_content}

    except Exception as e:
        print(f"REST API Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Service Failed: {str(e)}")

# --- Post Endpoints ---

@app.get("/")
async def root():
    return {"message": "API is running (SQLite Mode)"}

@app.post("/api/posts/")
async def create_post(post: PostCreate, current_user: str = Depends(get_current_user)):
    new_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    content_str = json.dumps(post.content) 
    
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO posts (id, title, content, status, created_at, updated_at, author_username) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (new_id, post.title, content_str, post.status, timestamp, timestamp, current_user)
        )
        conn.commit()
        
    return {"id": new_id, "message": "Draft created"}

@app.get("/api/posts/")
async def get_posts():
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        # In a real app, maybe filter by user? For now show all.
        cursor.execute("SELECT * FROM posts ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            post_dict = dict(row)
            post_dict["_id"] = post_dict.pop("id") 
            try:
                post_dict["content"] = json.loads(post_dict["content"])
            except:
                post_dict["content"] = {}
            results.append(post_dict)
            
        return results

@app.patch("/api/posts/{id}")
async def update_post(id: str, post: PostUpdate, current_user: str = Depends(get_current_user)):
    timestamp = datetime.utcnow().isoformat()
    
    update_fields = []
    values = []
    
    if post.title is not None:
        update_fields.append("title = ?")
        values.append(post.title)
    if post.content is not None:
        update_fields.append("content = ?")
        values.append(json.dumps(post.content))
    if post.status is not None:
        update_fields.append("status = ?")
        values.append(post.status)
        
    if not update_fields:
        return {"message": "No changes"}
        
    update_fields.append("updated_at = ?")
    values.append(timestamp)
    
    values.append(id) 
    
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        # Verify author? For simplicity, any logged in user can edit. 
        # ( Ideally: AND author_username = ?)
        sql = f"UPDATE posts SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(sql, tuple(values))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        conn.commit()

    return {"message": "Post updated successfully"}

@app.delete("/api/posts/{id}")
async def delete_post(id: str, current_user: str = Depends(get_current_user)):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM posts WHERE id = ?", (id,))
        # Check if any row was deleted
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        conn.commit()

    return {"message": "Post deleted successfully"}