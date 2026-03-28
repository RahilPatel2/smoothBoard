const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// 🚀 INIT
const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 🧠 ROOM STORE
const rooms = {};

// 🔌 SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  let currentRoom = null;

  // 📌 JOIN ROOM
  socket.on("join_room", ({ room, username, color }) => {
    if (!room) return;

    socket.join(room);
    currentRoom = room;

    if (!rooms[room]) {
      rooms[room] = {
        history: [],
        redo: [],
        currentStroke: null,
        users: {},
        notes: {}, // ✅ NEW
      };
    }

    rooms[room].users[socket.id] = {
      username,
      color,
    };

    console.log(`📌 ${socket.id} (${username}) joined room: ${room}`);

    socket.emit("load_history", rooms[room].history);

    // ✅ SEND NOTES ON JOIN
    socket.emit("notes_update", rooms[room].notes);

    io.to(room).emit("users_update", rooms[room].users);
  });

  // 🎨 DRAW
  socket.on("draw", (data) => {
    const r = rooms[data.room];
    if (!r) return;

    if (!r.currentStroke) {
      r.currentStroke = [];
    }

    r.currentStroke.push(data);

    socket.to(data.room).emit("draw", data);
  });

  // ✅ END STROKE
  socket.on("end_stroke", (room) => {
    const r = rooms[room];
    if (!r || !r.currentStroke) return;

    if (r.currentStroke.length > 0) {
      r.history.push(r.currentStroke);
    }

    r.currentStroke = null;
    r.redo = [];

    io.to(room).emit("sync_history", r.history);
  });

  // 🔙 UNDO
  socket.on("undo", (room) => {
    const r = rooms[room];
    if (!r || r.history.length === 0) return;

    const lastStroke = r.history.pop();
    r.redo.push(lastStroke);

    io.to(room).emit("sync_history", r.history);
  });

  // 🔜 REDO
  socket.on("redo", (room) => {
    const r = rooms[room];
    if (!r || r.redo.length === 0) return;

    const stroke = r.redo.pop();
    r.history.push(stroke);

    io.to(room).emit("sync_history", r.history);
  });

  // 🧽 CLEAR
  socket.on("clear", (room) => {
    const r = rooms[room];
    if (!r) return;

    r.history = [];
    r.redo = [];
    r.currentStroke = null;

    io.to(room).emit("clear");
  });

  // 🖱️ CURSOR
  socket.on("cursor_move", (data) => {
    if (!data.room) return;

    socket.to(data.room).emit("cursor_move", {
      id: socket.id,
      x: data.x,
      y: data.y,
      username: data.username,
      color: data.color,
    });
  });

  // 💬 CHAT
  socket.on("chat_message", (data) => {
    if (!data.room) return;

    const message = {
      username: data.username,
      message: data.message,
      time: new Date().toLocaleTimeString(),
    };

    io.to(data.room).emit("chat_message", message);
  });

  // =========================
  // 🗒️ STICKY NOTES (FIXED 🔥)
  // =========================

  // ➕ ADD NOTE
  socket.on("add_note", ({ room, note }) => {
    const r = rooms[room];
    if (!r) return;

    const id = String(note.id); // 🔥 FIX
    r.notes[id] = note;

    io.to(room).emit("notes_update", r.notes);
  });

  // ✏️ UPDATE NOTE
  socket.on("update_note", ({ room, id, updated }) => {
    const r = rooms[room];
    if (!r) return;

    const noteId = String(id); // 🔥 FIX
    if (!r.notes[noteId]) return;

    r.notes[noteId] = {
      ...r.notes[noteId],
      ...updated,
    };

    io.to(room).emit("notes_update", r.notes);
  });

  // ❌ DELETE NOTE (FINAL FIX)
  socket.on("delete_note", ({ room, id }) => {
    const r = rooms[room];
    if (!r) return;

    const noteId = String(id); // 🔥 CRITICAL FIX

    delete r.notes[noteId];

    io.to(room).emit("notes_update", r.notes);
  });

  // ❌ DISCONNECT
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].users[socket.id];

      io.to(currentRoom).emit(
        "users_update",
        rooms[currentRoom].users
      );
    }
  });
});

// 🌐 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("🚀 Whiteboard Server Running");
});

// 🚀 START SERVER
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});