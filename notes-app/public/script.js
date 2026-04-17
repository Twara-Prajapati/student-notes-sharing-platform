/**
 * NoteVault — script.js
 * Handles: auth state, load notes, search, filter chips,
 *          preview (PDF / image in new tab), download
 */

const API = "";          // same origin
let allNotes = [];       // cache for client-side search fallback

// ─────────────────────────────────────────────────────────────
// 1. AUTH HELPERS
// ─────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");
const getUser  = () => JSON.parse(localStorage.getItem("user") || "null");

function applyAuthUI() {
  const loggedIn = !!getToken();
  const user     = getUser();

  el("nav-upload")   && show("nav-upload",   loggedIn);
  el("nav-logout")   && show("nav-logout",   loggedIn);
  el("nav-login")    && show("nav-login",    !loggedIn);
  el("nav-register") && show("nav-register", !loggedIn);

  if (loggedIn && user && el("nav-username")) {
    el("nav-username").textContent = user.username;
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// ─────────────────────────────────────────────────────────────
// 2. DOM UTILITIES
// ─────────────────────────────────────────────────────────────
const el   = id => document.getElementById(id);
const show = (id, visible) => el(id) && (el(id).style.display = visible ? "" : "none");

function showToast(msg, type = "success") {
  const t = el("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove("show"), 3800);
}

// ─────────────────────────────────────────────────────────────
// 3. FILE HELPERS
// ─────────────────────────────────────────────────────────────
function fileIcon(name = "") {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map = { pdf: "📕", doc: "📘", docx: "📘", ppt: "📙", pptx: "📙", txt: "📄" };
  return map[ext] || "📄";
}

function fileLabel(name = "") {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map = { pdf: "PDF", doc: "Word", docx: "Word", ppt: "PowerPoint", pptx: "PowerPoint", txt: "Text" };
  return map[ext] || ext.toUpperCase();
}

function canPreview(name = "") {
  // Browsers can natively open PDFs and images
  return /\.(pdf|png|jpg|jpeg|gif|webp|svg)$/i.test(name);
}

function fileURL(filePath) {
  // filePath is just the stored filename, served under /uploads/
  return `/uploads/${filePath}`;
}

// ─────────────────────────────────────────────────────────────
// 4. PREVIEW & DOWNLOAD
// ─────────────────────────────────────────────────────────────
function previewNote(filePath, originalName) {
  if (!canPreview(originalName)) {
    showToast(`Preview not available for ${fileLabel(originalName)} files. Use Download instead.`, "error");
    return;
  }
  window.open(fileURL(filePath), "_blank");
}

function downloadNote(filePath, originalName) {
  const a = document.createElement("a");
  a.href     = fileURL(filePath);
  a.download = originalName;
  a.target   = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Downloading "${originalName}"…`);
}

// ─────────────────────────────────────────────────────────────
// 5. RENDER NOTES
// ─────────────────────────────────────────────────────────────
function renderNotes(notes) {
  const grid  = el("notesGrid");
  const count = el("resultsCount");
  if (!grid) return;

  if (count) {
    count.textContent = notes.length === 0
      ? "No results"
      : `${notes.length} note${notes.length !== 1 ? "s" : ""}`;
  }

  if (notes.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗂️</div>
        <h4>No notes found</h4>
        <p>Try a different search or <a href="upload.html">upload the first one</a>.</p>
      </div>`;
    return;
  }

  grid.innerHTML = notes.map(n => {
    const date       = new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const by         = n.uploadedBy?.username || "Anonymous";
    const canPrev    = canPreview(n.fileName);
    const label      = fileLabel(n.fileName);
    const icon       = fileIcon(n.fileName);

    return `
    <div class="note-card" data-id="${n._id}">
      <div class="card-top">
        <span class="card-type-badge ${label.toLowerCase()}">${label}</span>
        <span class="card-icon">${icon}</span>
      </div>

      <div class="card-subject">${n.subject}</div>
      <h3 class="card-title">${n.title}</h3>

      <div class="card-meta">
        <span class="meta-item">👤 ${by}</span>
        <span class="meta-item">🗓 ${date}</span>
      </div>

      <div class="card-filename" title="${n.fileName}">
        <span class="filename-text">📎 ${n.fileName}</span>
      </div>

      <div class="card-actions">
        <button
          class="btn-action btn-preview ${canPrev ? "" : "disabled"}"
          onclick="previewNote('${n.filePath}', '${n.fileName.replace(/'/g, "\\'")}')"
          title="${canPrev ? "Open in new tab" : "Preview not available for this file type"}"
        >
          ${canPrev ? "👁 Preview" : "👁 No Preview"}
        </button>
        <button
          class="btn-action btn-download"
          onclick="downloadNote('${n.filePath}', '${n.fileName.replace(/'/g, "\\'")}')"
          title="Download file"
        >
          ⬇ Download
        </button>
      </div>
    </div>`;
  }).join("");
}

// ─────────────────────────────────────────────────────────────
// 6. FETCH NOTES FROM BACKEND
// ─────────────────────────────────────────────────────────────
async function fetchNotes(subject = "") {
  const grid  = el("notesGrid");
  const count = el("resultsCount");

  // Show skeleton
  if (grid) grid.innerHTML = skeletons(6);
  if (count) count.textContent = "Loading…";

  const url = subject
    ? `${API}/api/notes?subject=${encodeURIComponent(subject)}`
    : `${API}/api/notes`;

  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load notes");

    allNotes = data.notes;
    renderNotes(allNotes);

    // update page title
    const title = el("resultsTitle");
    if (title) title.textContent = subject ? `Subject: ${subject}` : "All Notes";
  } catch (err) {
    showToast(err.message, "error");
    if (grid) grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h4>Could not load notes</h4>
        <p>${err.message}</p>
      </div>`;
    if (count) count.textContent = "";
  }
}

// ─────────────────────────────────────────────────────────────
// 7. SEARCH
// ─────────────────────────────────────────────────────────────
function doSearch() {
  const q = (el("searchInput")?.value || "").trim();
  setActiveChip(q ? null : "");   // deselect chips on custom search
  fetchNotes(q);
}

function setActiveChip(value) {
  document.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.subject === value);
  });
}

function filterChip(chipEl, subject) {
  setActiveChip(subject);
  if (el("searchInput")) el("searchInput").value = subject;
  fetchNotes(subject);
}

// Live search: filter already-loaded notes client-side as user types
function onSearchInput() {
  const q = (el("searchInput")?.value || "").trim().toLowerCase();
  if (!q) {
    // Re-render full list if input cleared
    renderNotes(allNotes);
    el("resultsTitle") && (el("resultsTitle").textContent = "All Notes");
    return;
  }
  const filtered = allNotes.filter(n =>
    n.subject.toLowerCase().includes(q) ||
    n.title.toLowerCase().includes(q)
  );
  renderNotes(filtered);
  if (el("resultsTitle")) el("resultsTitle").textContent = `Search: "${q}"`;
}

// ─────────────────────────────────────────────────────────────
// 8. SKELETON LOADER
// ─────────────────────────────────────────────────────────────
function skeletons(n) {
  return Array.from({ length: n }, () => `
    <div class="note-card skeleton-card">
      <div class="sk sk-badge"></div>
      <div class="sk sk-subject"></div>
      <div class="sk sk-title"></div>
      <div class="sk sk-title short"></div>
      <div class="sk sk-meta"></div>
      <div class="sk sk-actions"></div>
    </div>`).join("");
}

// ─────────────────────────────────────────────────────────────
// 9. INIT
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  applyAuthUI();

  // Attach search events if on index page
  const searchInput = el("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input",  onSearchInput);
    searchInput.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
  }

  // Load notes if grid exists
  if (el("notesGrid")) fetchNotes();
});
