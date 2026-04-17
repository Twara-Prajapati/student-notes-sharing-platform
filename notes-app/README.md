# NoteVault

A full-stack notes sharing web app — upload, preview, and download study notes.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose), Multer, bcryptjs, JWT
- **Frontend**: Vanilla HTML/CSS/JS (no framework)

## Project Structure
```
notes-app/
├── server.js                    # Entry point — port 3000
├── .env                         # Environment variables
├── models/
│   ├── User.js                  # username, email, hashed password
│   └── Note.js                  # title, subject, filePath, uploadedBy
├── routes/
│   ├── userRoutes.js            # POST /api/users/register  /login
│   └── noteRoutes.js            # POST /api/notes/upload  GET /api/notes
├── middleware/
│   └── authMiddleware.js        # JWT protect middleware
├── uploads/                     # Stored note files (auto-created by Multer)
└── public/                      # Frontend (served as static)
    ├── index.html               # Dashboard — browse & search notes
    ├── register.html            # Registration form
    ├── login.html               # Login form
    ├── upload.html              # Upload form (auth-gated)
    ├── script.js                # All frontend JS logic
    └── style.css                # Full responsive stylesheet
```

## Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/notesapp
JWT_SECRET=your_secret_key_here
```

### 3. Start MongoDB
Make sure MongoDB is running locally:
```bash
mongod
```

### 4. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### 5. Open in browser
```
http://localhost:3000
```

## API Endpoints

### Users
| Method | Route | Body | Auth |
|--------|-------|------|------|
| POST | `/api/users/register` | `{username, email, password}` | Public |
| POST | `/api/users/login` | `{email, password}` | Public |

### Notes
| Method | Route | Body/Params | Auth |
|--------|-------|-------------|------|
| POST | `/api/notes/upload` | `FormData: {title, subject, file}` | Bearer token |
| GET | `/api/notes` | `?subject=Chemistry` (optional) | Public |

### Files
Uploaded files are served at:
```
http://localhost:3000/uploads/<filename>
```

## Features
- **Register / Login** with bcrypt-hashed passwords and JWT tokens
- **Upload notes** (PDF, DOC, DOCX, PPT, PPTX, TXT) with drag-and-drop
- **Preview** PDFs and images directly in a new browser tab
- **Download** any file locally
- **Search** notes by subject or title (live + server-side)
- **Filter chips** for quick subject browsing
- Responsive layout for desktop & tablet
