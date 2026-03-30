import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const editorRef = useRef(null);

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  });

  const [users, setUsers] = useState([]);

  const visibleUsers = useMemo(() => {
    const seen = new Map();
    users.forEach((user) => {
      if (!user?.username) return;
      const cleanName = user.username.trim();
      const key = cleanName.toLowerCase();
      if (!seen.has(key)) seen.set(key, cleanName);
    });
    return Array.from(seen.values());
  }, [users]);

  // Yjs
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  // Provider 
  const provider = useMemo(() => {
    return new SocketIOProvider("/","monaco",ydoc,{ autoConnect: true });
  }, [ydoc]);

  // Bind editor
  const handleMount = (editor) => {
    editorRef.current = editor;

    new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
  };

  // Join
  const handleJoin = (e) => {
    e.preventDefault();
    const name = e.target.username.value.trim();
    if (!name) return;

    setUsername(name);
    window.history.pushState({}, "", "?username=" + name);
  };


  useEffect(() => {
    if (!username) return;

    provider.awareness.setLocalStateField("user", { username });

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());

      const activeUsers = states
        .filter((s) => s.user?.username)
        .map((s) => s.user);

      setUsers(activeUsers);
    };

    updateUsers();
    provider.awareness.on("change", updateUsers);

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      provider.awareness.off("change", updateUsers);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [username, provider]);

  if (!username) {
    return (
      <main className="login-wrap">
        <div className="bg-orb bg-orb-one" />
        <div className="bg-orb bg-orb-two" />
        <form
          onSubmit={handleJoin}
          className="login-card"
        >
          <p className="eyebrow">Realtime Workspace</p>
          <h1 className="login-title">Code Collaboration</h1>
          <p className="login-subtitle">Join your shared room and start coding together.</p>

          <input
            type="text"
            name="username"
            autoComplete="off"
            placeholder="Enter your name"
            className="name-input"
          />

          <button className="join-btn" type="submit">
            Join Room
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="bg-orb bg-orb-one" />
      <div className="bg-orb bg-orb-two" />
      <div className="app-grid">
        <aside className="panel sidebar">
          <div className="sidebar-header">
            <h2>Active Users</h2>
            <p>{visibleUsers.length} online</p>
          </div>

          <ul className="user-list">
            {visibleUsers.map((name) => (
              <li key={name} className="user-item">
                <div className="user-avatar">{name[0].toUpperCase()}</div>
                <span className="user-name">{name}</span>
                {name.toLowerCase() === username.toLowerCase() ? (
                  <span className="you-tag">You</span>
                ) : null}
                <span className="status-dot" />
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel editor-panel">
          <div className="editor-toolbar">
            <h2>Collaborative Editor</h2>
            <span className="session-pill">Signed in as {username}</span>
          </div>

          <div className="editor-stage">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              onMount={handleMount}
              options={{
                minimap: { enabled: false },
                smoothScrolling: true,
                fontSize: 14,
                lineHeight: 22,
                padding: { top: 16 },
                cursorBlinking: "smooth",
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
