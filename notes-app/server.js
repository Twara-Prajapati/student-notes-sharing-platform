const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));          // HTML pages
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // uploaded files at /uploads/<filename>

// ── Routes ─────────────────────────────────────────────────
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));

// ── Fallback: serve index.html for any unknown GET ─────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── MongoDB + Start ────────────────────────────────────────
const PORT = 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/notesapp";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
