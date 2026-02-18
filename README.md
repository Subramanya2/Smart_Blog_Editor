# Smart Blog Editor

A Notion-style block editor built with **React (Vite)**, **FastAPI**, and **Lexical**, featuring AI-powered writing assistance and robust state management.

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Google Gemini API Key

### 1. Backend Setup (FastAPI)
```bash
cd server
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `server/` directory:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

Run the server:
```bash
uvicorn main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.

### 2. Frontend Setup (React)
```bash
cd client
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## 💾 Auto-Save Logic (DSA Implementation)

We implemented a custom `useAutoSave` hook to handle draft persistence efficiently.

**Mechanism:**
- **Debouncing:** We use a `useRef` based debounce mechanism. When the user types, any existing timeout is cleared (`clearTimeout`), and a new 2-second timer is set.
- **Efficiency:** This approach is **O(1)** for each keystroke (canceling and setting a timer) and ensures we only fire a network request once the user stops typing.
- **Hook Extraction:** The logic is encapsulated in `client/src/hooks/useAutoSave.js`, separating concerns from the UI component.

```javascript
// Simplified Logic
timeoutRef.current = setTimeout(async () => {
    await saveToBackend(content);
}, 2000);
```

---

## 🗄️ Database Schema Decisions

We chose **SQLite** for this project, but with a production-ready schema design.

### Why this Schema?
1.  **JSON Storage for Content:**
    - We store the post content as a **JSON string** (`content TEXT`) rather than HTML.
    - **Reason:** Lexical is a state-based editor. Storing the raw JSON state ensures we lose **zero data** (formatting, nodes, custom entities) and allows full re-hydration of the editor state. Storing HTML would result in information loss.

2.  **UUIDs for IDs:**
    - We use UUID strings for `id` instead of auto-incrementing integers.
    - **Reason:** UUIDs are safer for distributed systems and prevent ID enumeration attacks.

3.  **Separation of Concerns:**
    - `users` table handles authentication (hashed passwords).
    - `posts` table handles content, linked by `author_username`.
    - This relational design is normalized and scalable.

### Schema
**Posts Table:**
- `id` (PK, TEXT)
- `title` (TEXT)
- `content` (TEXT, JSON)
- `status` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)
- `author_username` (TEXT, FK)

**Users Table:**
- `username` (PK, TEXT)
- `password_hash` (TEXT)
