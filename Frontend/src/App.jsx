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

  // Yjs doc
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  // SINGLE provider instance 
  const provider = useMemo(() => {
    return new SocketIOProvider("http://localhost:3000", "monaco",ydoc,{ autoConnect: true });
  }, [ydoc]);

  // Bind Monaco with Yjs + Awareness
  const handleMount = (editor) => {
    editorRef.current = editor;

    new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness 
    );
  };

  // Join handler
  const handleJoin = (e) => {
    e.preventDefault();

    const name = e.target.username.value.trim();
    if (!name) return;

    setUsername(name);
    window.history.pushState({}, "", "?username=" + name);
  };

  useEffect(() => {
    if (!username) return;

    // set current user
    provider.awareness.setLocalStateField("user", { username });

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());

      const activeUsers = states
        .filter((state) => state.user && state.user.username)
        .map((state) => state.user);

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
      <main className="h-screen w-full bg-gray-950 flex items-center justify-center">
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4 bg-neutral-800 p-6 rounded-lg"
        >
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            className="p-2 rounded-lg bg-gray-800 text-white"
          />
          <button className="p-2 rounded-lg bg-amber-50 text-gray-950 font-bold">
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      {/* USERS PANEL */}
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg">
        <h2 className="text-2xl font-bold p-4 border-b border-gray-300">
          Users
        </h2>
        <ul className="p-4">
          {users.map((user, index) => (
            <li
              key={index}
              className="p-2 bg-gray-800 text-white rounded mb-2"
            >
              {user.username}
            </li>
          ))}
        </ul>
      </aside>

      {/* EDITOR */}
      <section className="w-3/4 bg-neutral-800 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;