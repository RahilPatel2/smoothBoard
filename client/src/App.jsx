import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Board from "./pages/Board";
import { socket } from "./socket/socket";

function App() {
  const [room, setRoom] = useState("");
  const [username, setUsername] = useState("");

  // 🌗 Theme State
  const [darkMode, setDarkMode] = useState(false);

  // 🔁 Load theme from localStorage (FIXED)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  // 🔄 Toggle Theme (🔥 FIXED PROPERLY)
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  // ✅ Clean username setter
  const handleSetUsername = (name) => {
    const cleanName = name?.trim();
    if (!cleanName) return;
    setUsername(cleanName);
  };

  // 🧽 Clear board
  const handleClear = () => {
    if (!room) return;

    const confirmClear = window.confirm(
      "Are you sure you want to clear the board for everyone?"
    );

    if (!confirmClear) return;

    socket.emit("clear", room);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-300">

      {/* 🔝 Navbar */}
      <Navbar
        room={room}
        username={username}
        onClear={handleClear}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
      />

      {/* 🧩 Main Content */}
      <div className="flex-1 overflow-hidden">
        {room ? (
          <Board room={room} username={username} />
        ) : (
          <Home
            setRoom={setRoom}
            setUsername={handleSetUsername}
          />
        )}
      </div>

    </div>
  );
}

export default App;