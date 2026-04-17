const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const Note    = require("../models/Note");
const { protect } = require("../middleware/authMiddleware");
const { UPLOADS_DIR } = require("../config");

// ── Multer config ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /\.(pdf|doc|docx|ppt|pptx|txt)$/i.test(file.originalname);
  ok ? cb(null, true) : cb(new Error("Only PDF, DOC, DOCX, PPT, PPTX, TXT files allowed"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── POST /api/notes/upload ─────────────────────────────────
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { title, subject } = req.body;
    if (!title || !subject)
      return res.status(400).json({ message: "Title and subject are required" });

      const note = await Note.create({
        title,
        subject,
        fileName: req.file.originalname,          // original display name
        filePath: req.file.filename,              // just the stored filename, e.g. "1234567-abc.pdf"
        fileType: req.file.mimetype,
        uploadedBy: req.user._id,
      });

    res.status(201).json({ message: "Note uploaded successfully", note });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── GET /api/notes ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { subject } = req.query;
    const query = subject ? { subject: { $regex: subject, $options: "i" } } : {};

    const notes = await Note.find(query)
      .populate("uploadedBy", "username email")
      .sort({ createdAt: -1 });

    res.json({ count: notes.length, notes });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
