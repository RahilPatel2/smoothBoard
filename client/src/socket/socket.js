import { io } from "socket.io-client";

// 🌐 Dynamic URL (works in dev + production)
const URL =
  import.meta.env.VITE_BACKEND_URL || "https://smoothboard.onrender.com";

// 🔥 Create socket with better config
export const socket = io(URL, {
  transports: ["websocket"], // faster, avoids polling
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  autoConnect: true,
});

// ✅ Connected
socket.on("connect", () => {
  console.log("✅ CONNECTED:", socket.id);
});

// ❌ Connection error
socket.on("connect_error", (err) => {
  console.log("❌ ERROR:", err.message);
});

// 🔄 Reconnect attempt
socket.on("reconnect_attempt", (attempt) => {
  console.log("🔄 Reconnecting... Attempt:", attempt);
});

// 🔁 Reconnected
socket.on("reconnect", (attempt) => {
  console.log("🟢 Reconnected after attempts:", attempt);
});

// ❌ Disconnect
socket.on("disconnect", (reason) => {
  console.log("🔴 Disconnected:", reason);
});
