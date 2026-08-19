# Smart Blog Editor

A modern Notion-style collaborative rich-text editor built with **React 19**, **FastAPI**, **Meta's Lexical**, and **Yjs CRDTs**, featuring **Real-Time Multi-User Collaboration**, an **Ultra-Fast Streaming AI Copilot (Ghost Text)** powered by **Groq & Google Gemini**, and a full formatting toolbar.

---

## ✨ Key Features

- 🤝 **Real-Time CRDT Collaboration**: Powered by **Yjs** (`@lexical/yjs`) and WebSocket relay. Multiple authors can edit the same draft simultaneously with deterministic conflict resolution.
- 🤖 **Streaming AI Copilot (Ghost Text)**: Inline AI completion with real-time SSE (`text/event-stream`). Multi-provider AI architecture (Groq LLaMA/Compound with fallback to Google Gemini 2.5 Flash and offline mock streaming).
- ⌨️ **Tab Acceptance & Instant Commit**: Press `Tab` to accept suggestions and move cursor seamlessly to the end; type any key to abort the network stream.
- 🎨 **Rich Text Formatting Toolbar**: Bold, Italic, Underline, Strikethrough, Headings (H1–H3), Bullet Lists, Numbered Lists, Blockquotes, and live Word Counter.
- 💾 **Intelligent Multi-Path Auto-Save**: Immediate asynchronous database saves on Tab acceptance; debounced 2s auto-saving for active typing to minimize write amplification.
- 🔐 **JWT Authentication & Role Security**: PBKDF2 password hashing, secure JWT claims, and protected React client routes.
- 🏗️ **Clean Modular Architecture**: FastAPI `APIRouter` structure, Pydantic DTO models, custom Lexical AST node extensions, and Zustand global state management.

---

## 🌐 Live Demo & Endpoints
- **Frontend (Vercel)**: [Live Web App](https://smart-blog-editor-subramanya2s-projects.vercel.app)
- **Backend API (Render)**: [API Base URL](https://smart-blog-editor-girl.onrender.com)
- **Local Client**: `http://localhost:5173`
- **Local API & Swagger Docs**: `http://localhost:8000/docs`
- **WebSocket CRDT Relay**: `ws://localhost:8000/ws/{document_id}`
- **AI Streaming Copilot**: `POST /api/autocomplete`

---

## 📄 CV / Resume Highlights (Ready to Copy)

> **Smart Blog Editor — Real-Time Collaborative AI Rich-Text Editor** | *React 19, FastAPI, Lexical, Yjs, WebSockets, Groq API, SQLite*
> - Engineered a collaborative rich-text editor using Meta’s **Lexical** framework and **Yjs CRDTs** over WebSockets, enabling real-time simultaneous multi-user editing with zero merge conflicts.
> - Implemented an inline **Streaming AI Copilot (Ghost Text)** using Server-Sent Events (SSE) and Groq LLaMA / Gemini models, featuring sub-100ms response streaming and `Tab` acceptance.
> - Designed a custom Lexical AST node (`GhostTextNode`) and plugin architecture isolated from collaborative synchronization (`skip-collab` tags) to prevent CRDT state pollution.
> - Built a dual-path auto-save engine in React and FastAPI with immediate commit on AI acceptance and 2-second debouncing on active typing.

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key or Google Gemini API Key

---

### 1. Backend Setup (FastAPI)
```bash
cd smart-blog-editor/server

# Windows
py -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `server/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Run the server:
```bash
uvicorn main:app --reload --port 8000
```
API docs available at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup (React + Vite)
```bash
cd smart-blog-editor/client
npm install
npm run dev
```
Client runs at `http://localhost:5173`.

---

## 🏗️ Architecture & Component Design

```
smart-blog-editor/
├── client/
│   ├── src/
│   │   ├── components/      # UI components (Editor, ToolbarPlugin, GhostTextPlugin, Sidebar, AIModal)
│   │   ├── hooks/           # Custom hooks (useAutoSave, usePosts)
│   │   ├── nodes/           # Custom Lexical AST nodes (GhostTextNode)
│   │   ├── pages/           # Route views (Home, Login, Signup)
│   │   ├── services/        # Client networking (aiService, api, websocketService)
│   │   └── store.js         # Zustand authentication store
├── server/
│   ├── core/                # Database context, security, app configuration
│   ├── models/              # Pydantic schemas and DTOs
│   ├── routers/             # FastAPI routers (auth, posts, ai, websocket)
│   ├── services/            # Domain services (ai_service, post_service, websocket_manager)
│   └── main.py              # Application lifecycle and CORS middleware
```

---

## 💾 Technical Deep-Dive: CRDT & Ghost Text Isolation

1. **Transient Node Isolation**: Lexical's `@lexical/yjs` syncs all editor state changes across peers. To prevent temporary ghost text suggestions from leaking across the network, AI suggestions are dispatched using custom `{ tag: 'skip-collab' }` update flags.
2. **Dual-Path Persistence**: Auto-save distinguishes between regular keystrokes (2000ms debounce to avoid database churn) and `Tab` acceptance (`accept-ghost` tag with immediate asynchronous commit).
