# System Architecture

## Overview
Smart Blog Editor is a full-stack application designed for creating and managing rich text blog posts with AI capabilities.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Zustand, Lexical Editor
- **Backend**: FastAPI (Python), SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **AI**: Google Gemini API

## Backend Design (HLD)

### Database Schema (SQLite)
We use a relational schema to ensure data integrity.
- **Users**: Stores `username` and `password_hash`.
- **Posts**: Stores content, metadata, and links to `author_username`.
    - `content`: Stored as a JSON string (Lexical state) to ensure full fidelity of the rich text editor is preserved.
    - `status`: 'draft' or 'published'.

### API Structure
- **Auth**: `/login`, `/register` (JWT based).
- **Posts**: RESTful CRUD (`GET`, `POST`, `PATCH`). `PATCH` is used for auto-saving to minimize data transfer.
- **AI**: `/api/ai/generate` acts as a proxy to the Gemini API, keeping API keys secure on the server.

## Frontend Design (LLD)

### State Management (Zustand)
We use Zustand for its simplicity and performance.
- **Auth Store**: Persists user token in local storage.
- **Global UI State**: Tracks successful logins/logouts.

### Editor Component (Lexical)
- **Granular Updates**: The editor uses a custom `AutoSavePlugin` that listens for state updates.
- **Debouncing**: To prevent API spam, we implement a custom debounce mechanism using `setTimeout` and `useRef`. Changes are saved 2 seconds after the last keystroke.

### Security
- **Protected Routes**: React Router handles access control.
- **Headers**: Axios interceptor/config attaches the JWT token to requests.

## Directory Structure
```
/client
  /src
    /components  # Reusable UI (Sidebar, EditorArea, Editor, AIModal)
    /hooks       # Custom logic (usePosts, useAutoSave)
    /pages       # Route views (Home, Login, Signup)
    /store.js    # Global state (Zustand)
/server
  main.py        # API Entry point
  auth.py        # Authentication logic
  blog.db        # SQLite database
  requirements.txt
  .env           # Config
```
