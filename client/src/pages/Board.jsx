import { useEffect, useState, useRef } from "react";
import Canvas from "../components/Canvas";
import { socket } from "../socket/socket";

function Board({ room, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [showChat, setShowChat] = useState(false);

  const [notes, setNotes] = useState({});
  const [activeNote, setActiveNote] = useState(null);

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("chat_position");
    return saved ? JSON.parse(saved) : { x: 20, y: 100 };
  });

  const dragging = useRef(false);
  const moved = useRef(false);

  // 💬 CHAT SOCKET
  useEffect(() => {
    socket.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("chat_message");
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("chat_message", {
      room,
      username,
      message: input.trim(),
    });

    setInput("");
  };

  // 🗒️ NOTES SOCKET
  useEffect(() => {
    socket.on("notes_update", (data) => {
      setNotes(data || {});
    });

    return () => socket.off("notes_update");
  }, []);

  // ➕ ADD NOTE
  const addNote = () => {
    const id = Date.now().toString();

    const newNote = {
      id,
      x: 200,
      y: 200,
      text: "New note...",
      bgColor: "#fef08a",
      textColor: "#000000",
    };

    socket.emit("add_note", { room, note: newNote });
  };

  // ✏️ UPDATE NOTE
  const updateNote = (id, updated) => {
    socket.emit("update_note", {
      room,
      id,
      updated,
    });
  };

  // ❌ DELETE NOTE (ONLY NEW LOGIC)
  const deleteNote = (id) => {
    socket.emit("delete_note", {
      room,
      id,
    });
  };

  // 🖱️ DRAG NOTE (unchanged safe)
  const dragNote = (id, e) => {
    updateNote(id, {
      x: e.clientX,
      y: e.clientY,
    });
  };

  // =========================
  // 💬 CHAT DRAG SYSTEM (FIXED)
  // =========================

  const handleMouseDown = (e) => {
    e.stopPropagation();
    dragging.current = true;
    moved.current = false;
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;

    moved.current = true;

    setPosition({
      x: e.clientX - 30,
      y: e.clientY - 30,
    });
  };

  const handleMouseUp = () => {
    if (dragging.current) {
      localStorage.setItem("chat_position", JSON.stringify(position));
    }

    dragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [position]);

  const handleChatClick = (e) => {
    e.stopPropagation();

    if (moved.current) return;

    setShowChat((prev) => !prev);
  };

  return (
    <div className="select-none w-full h-full relative bg-gray-200 dark:bg-gray-900 overflow-hidden">

      <Canvas room={room} username={username} />

      <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded z-50">
        Room: {room}
      </div>

      <button
        onClick={addNote}
        className="select-none ui-element absolute top-4 right-4 z-50 bg-yellow-400 px-3 py-1 rounded shadow"
      >
        + Note
      </button>

      {/* 🗒️ NOTES */}
      {Object.values(notes).map((note) => (
        <div
          key={note.id}
          className="select-none ui-element absolute p-2 rounded shadow w-44 cursor-move"
          style={{
            left: note.x,
            top: note.y,
            backgroundColor: note.bgColor,
            color: note.textColor,
          }}
          onMouseDown={(e) => {
  const move = (ev) => dragNote(note.id, ev);
  const up = () => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
}}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold">Note</span>

            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNote(activeNote === note.id ? null : note.id);
                }}
                className="text-xs"
              >
                ⚙️
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                className="text-xs bg-black text-white px-2 rounded"
              >
                -
              </button>
            </div>
          </div>

          <textarea
            value={note.text}
            onChange={(e) =>
              updateNote(note.id, { text: e.target.value })
            }
            className="w-full bg-transparent outline-none text-sm resize-none"
          />

          {activeNote === note.id && (
            <div className="mt-2 flex flex-col gap-1 text-xs">
              <label className="flex items-center gap-2">
                🎨 BG
                <input
                  type="color"
                  value={note.bgColor}
                  onChange={(e) =>
                    updateNote(note.id, { bgColor: e.target.value })
                  }
                />
              </label>

              <label className="flex items-center gap-2">
                ✍️ Text
                <input
                  type="color"
                  value={note.textColor}
                  onChange={(e) =>
                    updateNote(note.id, { textColor: e.target.value })
                  }
                />
              </label>
            </div>
          )}
        </div>
      ))}

      {/* rest of your code untouched */}

      {/* 💬 FLOATING CHAT BUTTON (FIXED) */}
      <div
        className="ui-element absolute z-50 w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg select-none"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
        onClick={handleChatClick}
      >
        💬
      </div>

      {/* 💬 CHAT PANEL */}
      {showChat && (
        <div
          className="ui-element absolute w-72 h-[75%]
    bg-white dark:bg-gray-900
    shadow-2xl rounded-2xl flex flex-col z-50
    border border-gray-200 dark:border-gray-700
    transition-all duration-300"
          style={{ left: position.x + 70, top: position.y }}
        >

          {/* 🔝 HEADER */}
          <div className="flex items-center justify-between px-4 py-3
      bg-gray-100 dark:bg-gray-800
      rounded-t-2xl border-b border-gray-200 dark:border-gray-700">

            <span className="font-semibold text-gray-800 dark:text-white">
              💬 Chat
            </span>

            <button
              onClick={() => setShowChat(false)}
              className="text-gray-500 hover:text-red-500 transition"
            >
              ✕
            </button>
          </div>

          {/* 📜 MESSAGES */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">

            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-400 mt-4">
                No messages yet
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800
          px-3 py-2 rounded-xl shadow-sm"
              >
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {msg.username}
                </div>

                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {msg.message}
                </div>

                <div className="text-[10px] text-gray-400 text-right">
                  {msg.time}
                </div>
              </div>
            ))}
          </div>

          {/* ✍️ INPUT */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">

            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              className="flex-1 px-3 py-2 rounded-lg border
        bg-white dark:bg-gray-800
        text-gray-800 dark:text-white
        border-gray-300 dark:border-gray-600
        outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600
        text-white px-4 py-2 rounded-lg
        transition shadow"
            >
              Send
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default Board;