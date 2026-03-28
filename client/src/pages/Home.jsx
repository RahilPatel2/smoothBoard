import { useState, useEffect, useRef } from "react";
import RoomJoin from "../components/RoomJoin";

function Home({ setRoom, setUsername }) {
  const [name, setName] = useState("");
  const [step, setStep] = useState("name");

  const inputRef = useRef(null);

  // 🔥 Auto focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ✅ Handle Continue
  const handleContinue = () => {
    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 2) return;

    setUsername(cleanName);
    setStep("room");
  };

  return (
    <div className="w-full h-full flex items-center justify-center
      bg-gray-100 dark:bg-gray-900
      transition-colors duration-300">

      {/* 🟢 STEP 1: ENTER NAME */}
      {step === "name" && (
        <div className="bg-white dark:bg-gray-800
          p-6 rounded-xl shadow-lg w-80 text-center
          transition-colors duration-300">

          <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">
            Enter your name
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This will be shown to others in the room
          </p>

          <input
            ref={inputRef}
            type="text"
            placeholder="Your name..."
            className="w-full border px-3 py-2 rounded mb-4 outline-none
            bg-white dark:bg-gray-700
            text-black dark:text-white
            border-gray-300 dark:border-gray-600
            focus:ring-2 focus:ring-black dark:focus:ring-white transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleContinue();
            }}
          />

          <button
            disabled={!name.trim()}
            className={`w-full py-2 rounded transition ${
              name.trim()
                ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-80"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed"
            }`}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      )}

      {/* 🟢 STEP 2: ROOM JOIN */}
      {step === "room" && (
        <RoomJoin onJoin={setRoom} />
      )}
    </div>
  );
}

export default Home;