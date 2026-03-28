import { useState, useEffect, useRef } from "react";

function RoomJoin({ onJoin }) {
  const [room, setRoom] = useState("");
  const inputRef = useRef(null);

  // 🔥 Auto focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 🎲 Generate random room
  const generateRoom = () => {
    const random = Math.random().toString(36).substring(2, 8);
    setRoom(random);
  };

  // ✅ Join room
  const handleJoin = () => {
    const cleanRoom = room.trim();

    if (!cleanRoom) {
      alert("Please enter a valid room ID");
      return;
    }

    onJoin(cleanRoom);
  };

  // ⚡ Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  // 🔗 Copy room
  const copyRoom = () => {
    if (!room.trim()) return;
    navigator.clipboard.writeText(room.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center">

      <div className="bg-white dark:bg-gray-800
        p-8 rounded-2xl shadow-xl text-center w-80
        transition-colors duration-300">

        <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">
          Join a Room
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter an existing room or create a new one
        </p>

        <input
          ref={inputRef}
          className="border p-2 rounded w-full mb-4 outline-none
          bg-white dark:bg-gray-700
          text-black dark:text-white
          border-gray-300 dark:border-gray-600
          focus:ring-2 focus:ring-black dark:focus:ring-white transition"
          placeholder="Enter Room ID"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleJoin}
            className="flex-1 bg-black dark:bg-white
            text-white dark:text-black
            py-2 rounded hover:opacity-80 transition"
          >
            Join
          </button>

          <button
            onClick={generateRoom}
            className="flex-1 bg-gray-200 dark:bg-gray-600
            text-black dark:text-white
            py-2 rounded hover:opacity-80 transition"
          >
            Random
          </button>
        </div>

        {/* Copy */}
        {room.trim() && (
          <button
            onClick={copyRoom}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Copy Room ID
          </button>
        )}

      </div>
    </div>
  );
}

export default RoomJoin;