# Smart Blog Editor Frontend Client

React 19 + Vite frontend application powering the **Smart Blog Editor**, featuring real-time CRDT collaboration (Yjs) and a streaming AI Copilot (Ghost Text).

---

## 🛠️ Tech Stack & Dependencies

- **React 19 & Vite 7**: Modern, fast component rendering and dev server.
- **Lexical (`@lexical/react`)**: Meta's state-based rich text editor framework.
- **Yjs (`yjs`, `y-websocket`, `@lexical/yjs`)**: CRDT library for multi-user real-time collaboration over WebSockets.
- **Tailwind CSS**: Styling system.
- **Lucide React**: Modern iconography.
- **Zustand**: Persistent global authentication & UI state management.

---

## 📁 Directory Structure

```
client/src/
├── components/
│   ├── AIModal.jsx          # AI prompt modal (Summarize / Fix Grammar)
│   ├── Editor.jsx           # Main Lexical editor wrapper with Yjs collaboration
│   ├── EditorArea.jsx       # Header toolbar and editor layout container
│   ├── GhostTextPlugin.jsx  # Debounced AI copilot streaming plugin
│   ├── ProtectedRoute.jsx   # Route guard checking Zustand auth token
│   └── Sidebar.jsx          # Draft navigation, post creation & deletion
├── hooks/
│   ├── useAutoSave.js       # Debounced draft auto-saver hook
│   └── usePosts.js          # API CRUD post manager hook
├── nodes/
│   └── GhostTextNode.js     # Custom Lexical TextNode subclass for ghost suggestions
├── pages/
│   ├── Home.jsx             # Main dashboard view
│   ├── Login.jsx            # User authentication view
│   └── Signup.jsx           # User registration view
├── services/
│   ├── aiService.js         # SSE stream reader function for autocomplete
│   └── websocketService.js  # WebsocketProvider factory for Yjs CRDT sync
└── store.js                 # Zustand store with localStorage persistence
```

---

## 🏃 Available Scripts

- `npm run dev`: Starts local Vite development server (`http://localhost:5173`).
- `npm run build`: Bundles application for production in `dist/`.
- `npm run preview`: Previews built production bundle.
- `npm run lint`: Runs ESLint across client code.
