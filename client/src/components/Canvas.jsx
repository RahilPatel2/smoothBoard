import { useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";

function Canvas({ room, username }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);

  const isUIInteracting = useRef(false);

  const randomColor = () =>
    "#" + Math.floor(Math.random() * 16777215).toString(16);

  const [userColor] = useState(randomColor());

  const [color, setColor] = useState(userColor);
  const [brushSize, setBrushSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);

  const [cursors, setCursors] = useState({});

  const historyRef = useRef([]);

  const safeUsername = username?.trim() || "User";

  const colorRef = useRef(color);
  const sizeRef = useRef(brushSize);
  const eraserRef = useRef(isEraser);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { eraserRef.current = isEraser; }, [isEraser]);

  const drawLine = (line) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.lineWidth = line.size;
    ctx.lineCap = "round";

    ctx.globalCompositeOperation = line.isEraser
      ? "destination-out"
      : "source-over";

    if (!line.isEraser) {
      ctx.strokeStyle = line.color;
    }

    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  };

  const redraw = (history) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history.forEach((stroke) => stroke.forEach(drawLine));
  };

  // 🧽 CLEAR
  useEffect(() => {
    const handleClear = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;

      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [];
    };

    socket.on("clear", handleClear);
    return () => socket.off("clear", handleClear);
  }, []);

  useEffect(() => {
    if (!room) return;

    socket.emit("join_room", {
      room,
      username: safeUsername,
      color: userColor,
    });
  }, [room]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const ratio = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.scale(ratio, ratio); // KEEP THIS

    ctxRef.current = ctx;

    let prevX = 0;
    let prevY = 0;

    // 🔥 FIX: proper coordinate mapping
    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const start = (e) => {
      if (e.target.closest(".ui-element")) {
        isUIInteracting.current = true;
        return;
      }

      drawingRef.current = true;

      const { x, y } = getCoords(e);
      prevX = x;
      prevY = y;
    };

    const stop = () => {
      if (isUIInteracting.current) {
        isUIInteracting.current = false;
        return;
      }

      if (!drawingRef.current) return;
      drawingRef.current = false;
      socket.emit("end_stroke", room);
    };

    const draw = (e) => {
      socket.emit("cursor_move", {
        room,
        x: e.clientX,
        y: e.clientY,
        username: safeUsername,
        color: userColor,
      });

      if (isUIInteracting.current) return;
      if (!drawingRef.current) return;

      const { x, y } = getCoords(e);

      const line = {
        room,
        x1: prevX,
        y1: prevY,
        x2: x,
        y2: y,
        color: colorRef.current,
        size: sizeRef.current,
        isEraser: eraserRef.current,
        user: safeUsername,
      };

      drawLine(line);
      socket.emit("draw", line);

      prevX = x;
      prevY = y;
    };

    socket.on("cursor_move", (data) => {
      if (!data.id) return;

      setCursors((prev) => ({
        ...prev,
        [data.id]: data,
      }));
    });

    socket.on("load_history", (history) => {
      historyRef.current = history;
      redraw(history);
    });

    socket.on("sync_history", (history) => {
      historyRef.current = history;
      redraw(history);
    });

    socket.on("draw", drawLine);

    window.addEventListener("mousedown", start);
    window.addEventListener("mouseup", stop);
    window.addEventListener("mousemove", draw);

    return () => {
      socket.off("draw");
      socket.off("load_history");
      socket.off("sync_history");
      socket.off("cursor_move");

      window.removeEventListener("mousedown", start);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("mousemove", draw);
    };
  }, [room, safeUsername]);

  // 🔥 ACTIONS
  const handleUndo = () => socket.emit("undo", room);
  const handleRedo = () => socket.emit("redo", room);

  const handleSave = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");

    link.download = "whiteboard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
      {/* 🎛️ TOOLBAR */}
      <div className="ui-element fixed top-16 left-1/2 -translate-x-1/2
        bg-white dark:bg-gray-800
        shadow-lg rounded-xl px-4 py-2 flex gap-3 items-center z-50
        transition-colors duration-300">

        <input
          type="color"
          value={color}
          onChange={(e) => {
            setIsEraser(false);
            setColor(e.target.value);
          }}
        />

        <select
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="border rounded px-2 py-1
          bg-white dark:bg-gray-700
          text-black dark:text-white"
        >
          <option value={2}>Small</option>
          <option value={5}>Medium</option>
          <option value={10}>Large</option>
        </select>

        <button
          onClick={() => setIsEraser((prev) => !prev)}
          className={`px-3 py-1 rounded transition ${
            isEraser
              ? "bg-red-500 text-white"
              : "bg-gray-200 dark:bg-gray-600 dark:text-white"
          }`}
        >
          Eraser
        </button>

        <button
          onClick={handleUndo}
          className="bg-gray-300 dark:bg-gray-600 dark:text-white px-3 py-1 rounded hover:opacity-80 transition"
        >
          Undo
        </button>

        <button
          onClick={handleRedo}
          className="bg-gray-300 dark:bg-gray-600 dark:text-white px-3 py-1 rounded hover:opacity-80 transition"
        >
          Redo
        </button>

        <button
          onClick={handleSave}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
        >
          Save
        </button>
      </div>

      {/* 🖱️ CURSORS */}
      {Object.entries(cursors).map(([id, c]) => (
        c.username !== safeUsername && (
          <div
            key={id}
            className="absolute pointer-events-none z-50"
            style={{ left: c.x, top: c.y }}
          >
            <div
              className="text-xs px-2 py-1 rounded shadow"
              style={{ backgroundColor: c.color, color: "#fff" }}
            >
              {c.username}
            </div>
          </div>
        )
      ))}

      {/* 🎨 CANVAS */}
      <canvas
        ref={canvasRef}
        className="bg-white dark:bg-gray-900 block transition-colors duration-300"
      />
    </div>
  );
}

export default Canvas;