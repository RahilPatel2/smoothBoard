import { useEffect, useState, useRef } from "react";
import { socket } from "../socket/socket";

function Navbar({ room, username, onClear, darkMode, toggleTheme }) {
  const [users, setUsers] = useState({});
  const [showUsers, setShowUsers] = useState(false);

  const [cardPos, setCardPos] = useState(() => {
    const saved = localStorage.getItem("users_card_pos");
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 300, y: 80 };
  });

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // 👥 USERS
  useEffect(() => {
    socket.on("users_update", (usersData) => {
      setUsers(usersData || {});
    });

    return () => socket.off("users_update");
  }, []);

  // 🔥 DRAG START
  const handleMouseDown = (e) => {
    e.preventDefault(); // ✅ prevent text selection
    dragging.current = true;

    offset.current = {
      x: e.clientX - cardPos.x,
      y: e.clientY - cardPos.y,
    };
  };

  // 🔥 DRAG MOVE
  const handleMouseMove = (e) => {
    if (!dragging.current) return;

    setCardPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  // 🔥 DRAG END
  const handleMouseUp = () => {
    if (dragging.current) {
      localStorage.setItem("users_card_pos", JSON.stringify(cardPos));
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
  }, [cardPos]);

  return (
    <div className="select-none flex justify-between items-center px-6 py-3
      bg-gray-900 text-white shadow-md relative">

      {/* 👋 Greeting */}
      <h1 className="text-xl font-bold">
        {room && username ? `Welcome, ${username}!` : "EasyDraw"}
      </h1>

      {/* 🌗 THEME */}
      <button
        onClick={toggleTheme}
        className="select-none bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600"
      >
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>

      {/* 👥 USERS BUTTON */}
      <button
        onClick={() => setShowUsers((prev) => !prev)}
        className="select-none bg-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-600"
      >
        Users
      </button>

      {/* 🧽 CLEAR */}
      <button
        onClick={() => room && onClear()}
        disabled={!room}
        className={`select-none px-4 py-1 rounded text-sm ${
          room
            ? "bg-red-500 hover:bg-red-600"
            : "bg-gray-500 cursor-not-allowed"
        }`}
      >
        Clear
      </button>

      {/* 👥 USERS CARD */}
      {showUsers && (
        <div
          className="select-none absolute w-64 rounded-xl shadow-xl z-50
          bg-white dark:bg-gray-800 text-black dark:text-white"
          style={{ left: cardPos.x, top: cardPos.y }}
        >

          {/* 🔝 HEADER (DRAG HANDLE) */}
          <div
            onMouseDown={handleMouseDown}
            className="cursor-move select-none flex justify-between items-center px-4 py-2 border-b
            bg-gray-100 dark:bg-gray-700 rounded-t-xl"
          >
            <span className="font-semibold">Active Users</span>

            <button
              onClick={() => setShowUsers(false)}
              className="select-none text-red-500 font-bold"
            >
              ✕
            </button>
          </div>

          {/* 👥 USERS LIST */}
          <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(users).length === 0 && (
              <div className="text-sm text-gray-500">No users</div>
            )}

            {Object.entries(users).map(([id, user]) => (
              <div
                key={id}
                className="select-none flex items-center gap-2 px-2 py-1 rounded text-sm"
                style={{
                  backgroundColor: user.color || "#ccc",
                  color: "#fff",
                }}
              >
                {user.username}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;