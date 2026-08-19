# Smart Blog Editor

A Notion-style block editor built with **React 19 (Vite)**, **FastAPI**, **Lexical**, and **Yjs**, featuring **Real-Time CRDT Multi-User Collaboration** and a **Streaming AI Copilot (Ghost Text)** powered by **Google Gemini API**.

---

## ✨ Features

- 🤝 **Real-Time CRDT Collaboration**: Powered by **Yjs** and **y-websocket**. Multiple users can edit the same draft concurrently with zero conflict.
- 🤖 **Streaming AI Copilot (Ghost Text)**: Inline AI completion powered by **Google Gemini** streamed over Server-Sent Events (`text/event-stream`).
- ⌨️ **Tab Acceptance & Stream Abort**: Press `Tab` to convert streaming ghost text into document text; type any character key to instantly abort the network stream.
- 📝 **Rich Text Block Editor**: Meta's **Lexical** editor storing raw JSON state to preserve formatting fidelity.
- 💾 **Debounced Auto-Save**: Efficient O(1) auto-saving to SQLite database.
- 🔐 **JWT Authentication**: Password hashing with Passlib PBKDF2 and token-based route protection.
- 🏗️ **Enterprise Modular Architecture**: Clean separation of concerns with FastAPI `APIRouter`, Pydantic models, domain services, and client service modules.

---

## 🌐 Live Demo & Endpoints
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **WebSocket CRDT Relay**: `ws://localhost:8000/ws/{document_id}`
- **AI Streaming Copilot**: `POST /api/autocomplete`

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Google Gemini API Key

---

### 1. Backend Setup (FastAPI)
```bash
cd smart-blog-editor/server

# Windows
py -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `server/.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Run the server:
```bash
uvicorn main:app --reload --port 8000
```
API docs available at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup (React)
```bash
cd smart-blog-editor/client
npm install
npm run dev
```
Client will open at `http://localhost:5173`.

---

## 🏗️ Codebase Structure

```
smart-blog-editor/
├── client/
│   ├── src/
│   │   ├── components/      # UI components (Editor, Sidebar, AIModal, GhostTextPlugin)
│   │   ├── hooks/           # Custom hooks (useAutoSave, usePosts)
│   │   ├── nodes/           # Custom Lexical nodes (GhostTextNode)
│   │   ├── pages/           # Views (Home, Login, Signup)
│   │   ├── services/        # Service helpers (aiService, websocketService)
│   │   └── store.js         # Zustand auth store
├── server/
│   ├── core/                # Config, database context manager, security dependencies
│   ├── models/              # Pydantic schema DTOs (auth, post, ai)
│   ├── routers/             # FastAPI APIRouters (auth, posts, websocket, ai)
│   ├── services/            # Domain services (ai_service, post_service, websocket_manager)
│   └── main.py              # Lightweight app entry point
```

---

## 💾 Auto-Save & CRDT Sync Logic

1. **Yjs CRDT Synchronization**:
   - `CollaborationPlugin` binds Lexical state to a shared `Y.Doc`.
   - Binary CRDT updates are broadcasted across clients via `ws://localhost:8000/ws/{document_id}`.

2. **Debounced Draft Persistence**:
   - `useAutoSave` hook debounces updates (2 seconds) and issues a `PATCH /api/posts/{id}` request to update SQLite database state.

---

## 🗄️ Database Schema

### `posts` Table
- `id` (TEXT, Primary Key, UUID)
- `title` (TEXT)
- `content` (TEXT, Lexical JSON state)
- `status` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)
- `author_username` (TEXT, Foreign Key)

### `users` Table
- `username` (TEXT, Primary Key)
- `password_hash` (TEXT, PBKDF2)
