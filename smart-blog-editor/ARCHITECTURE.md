# System Architecture

## Overview
Smart Blog Editor is a full-stack application designed for real-time collaborative rich-text creation with a streaming AI Copilot powered by Google Gemini, Yjs, and FastAPI.

---

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, Lexical Editor, Yjs, `y-websocket`, `@lexical/yjs`
- **Backend**: FastAPI (Python), SQLite, PyJWT, Passlib, Uvicorn
- **Collaboration**: Yjs CRDT + WebSocket binary relay (`ws://localhost:8000/ws/{document_id}`)
- **AI Copilot**: Google Gemini API (`gemini-2.5-flash`) + Server-Sent Events (`POST /api/autocomplete`)

---

## Backend Architecture (FastAPI Modular Package Layout)

### 1. Layers
- **Core (`core/`)**: Centralized configuration (`config.py`), SQLite context manager & schema initialization (`database.py`), and JWT/Password hashing dependencies (`security.py`).
- **Models (`models/`)**: Strongly typed Pydantic DTO models for Authentication, Posts, and AI Requests.
- **Services (`services/`)**: Business logic layer containing:
  - `websocket_manager.py`: Connection room manager for broadcasting CRDT binary payloads.
  - `ai_service.py`: Google Gemini API streaming and REST fallback generators.
  - `post_service.py`: Database query functions for CRUD operations on blog posts.
- **Routers (`routers/`)**: Isolated API controllers mounted on the main application (`auth.py`, `posts.py`, `websocket.py`, `ai.py`).
- **Entry Point (`main.py`)**: Assembles CORS middleware, initializes database, and mounts routers.

### 2. Database Schema (SQLite)
- **`users`**: `username` (PK), `password_hash`
- **`posts`**: `id` (UUID PK), `title`, `content` (JSON Lexical state string), `status`, `created_at`, `updated_at`, `author_username`

---

## Frontend Architecture (React + Lexical)

### 1. Lexical Editor & CRDT Plugin
- **Collaboration**: `CollaborationPlugin` binds editor updates to `Y.Doc`. `createYjsProvider` initializes `WebsocketProvider` targeting `ws://localhost:8000/ws/{document_id}`.
- **History**: Handled natively by Yjs undo manager (standard `HistoryPlugin` removed to prevent stack conflicts).

### 2. Streaming AI Copilot (Ghost Text)
- **`GhostTextNode`**: Custom Lexical `TextNode` subclass styled as greyed-out, italic text (`text-gray-400 opacity-60 italic`).
- **`GhostTextPlugin`**: React plugin that listens to editor state changes:
  - **2s Debounce**: Triggers `streamAutocomplete` from `aiService.js`.
  - **SSE Reader**: Reads `text/event-stream` chunks and appends text to `GhostTextNode`.
  - **`AbortController`**: Instantly aborts active stream on any non-Tab keydown event.
  - **Tab Acceptance**: Traps `KEY_TAB_COMMAND` to convert `GhostTextNode` into standard text nodes.

---

## System Architecture Diagram

```mermaid
graph TD
    UserA((User A))
    UserB((User B))
    
    subgraph Client [Frontend (React + Lexical)]
        UI[React UI Components]
        Lexical[Lexical Composer]
        GhostNode[GhostTextNode]
        Yjs[Y.Doc CRDT]
        Store[Zustand Auth Store]
        AIService[aiService SSE Reader]
    end
    
    subgraph Server [Backend (FastAPI)]
        Main[main.py Entry]
        WSRelay[WebSocket Relay Router]
        AIRouter[AI Autocomplete Router]
        AuthRouter[Auth Router]
        PostRouter[Posts Router]
        DB[(SQLite DB)]
    end
    
    subgraph External [External API]
        Gemini[Google Gemini API]
    end
    
    UserA -->|Interacts| UI
    UserB -->|Interacts| UI
    UI --> Lexical
    Lexical --> Yjs
    
    Yjs <-->|Binary WS Sync| WSRelay
    Lexical -->|2s Debounce| AIService
    AIService -->|POST /api/autocomplete SSE| AIRouter
    AIRouter -->|Stream Content| Gemini
    
    UI -->|API Requests| AuthRouter
    UI -->|API Requests| PostRouter
    AuthRouter --> DB
    PostRouter --> DB
```
