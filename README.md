# HyperTube

A web application for searching and watching videos using BitTorrent protocol.

## Project Overview

HyperTube is a full-stack web application that allows users to:
- Search for videos from multiple external sources
- Stream videos while downloading via BitTorrent
- Manage user profiles with OAuth authentication
- Comment on videos and interact with the community
- Access a RESTful API with OAuth2 authentication

## Tech Stack

### Backend
- **Node.js** with **Express.js** - Server framework
- **PostgreSQL** - Database
- **Passport.js** - Authentication (OAuth2, JWT)
- **libtorrent** (via node-libtorrent or similar) - BitTorrent client
- **FFmpeg** - Video conversion and processing
- **Nodemailer** - Email service for password reset

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client

## Prerequisites

- Node.js (v18 or higher) - [Download](https://nodejs.org/)
- PostgreSQL (v14 or higher) - [Download](https://www.postgresql.org/download/)
- FFmpeg - [Download](https://ffmpeg.org/download.html)
- Git
## Installation

### Option 1: Automated Installation (Recommended)

**Windows (PowerShell):**
```powershell
.\install.ps1
```

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh
```

### Option 2: Manual Installation

#### 1. Backend Setup

```bash
cd backend
npm install
```

**Note:** Node.js n'utilise pas de virtualenv comme Python. Les dépendances sont installées localement dans `node_modules/` de chaque projet, ce qui isole déjà les dépendances.

#### 2. Frontend Setup

```bash
cd ../frontend
npm install
```

#### 3. Environment Variables

Create a `.env` file in the `backend` directory (see `ENV_SETUP.md` for details):

**Windows (PowerShell):**
```powershell
Copy-Item ENV_SETUP.md backend\.env.example
# Then edit backend\.env with your actual values
```

**Linux/macOS:**
```bash
# Create .env file manually in backend/ directory
# See ENV_SETUP.md for all required variables
```

Edit `.env` with your configuration:
- Database credentials
- OAuth client IDs and secrets (42, Google, etc.)
- JWT secret
- Email configuration
- API keys (OMDb, TMDb, etc.)
- Optional: **`UPLOADS_ROOT`** — avatar files directory (default: `backend/uploads`). For local dev aligned with Docker, set to the absolute path of `frontend/uploads` or `../frontend/uploads` from `backend/`.

#### Profile avatars and URLs

- **DB:** `users.profile_picture_url` stores a **relative** path for uploads, e.g. `/uploads/avatars/{userId}.jpg`. OAuth (Google) may store full HTTPS URLs.
- **Docker:** `docker-compose` mounts `./frontend/uploads` → `/app/uploads` on the backend.
- Avatars are served under `/api/uploads/...` via the same origin as the frontend (Docker Nginx or Vite dev proxy).
- **`FRONTEND_URL`** — browser URL of the frontend (default `http://localhost:5173`). Used for CORS and OAuth redirects.
- **`JACKETT_URL`** — Jackett API base (default `http://localhost:9117`; in Docker use `http://jackett:9117`).
- **Frontend env** (`frontend/.env` or build args): **`VITE_API_URL=/api`** (relative path). Optional **`VITE_MEDIA_URL`** for absolute media URLs.

#### 4. Database Setup

Create a PostgreSQL database:

```bash
createdb hypertube
```

Run the schema:

```bash
psql hypertube < backend/database/schema.sql
```

### 5. Install FFmpeg

**Windows:**
- Download from https://ffmpeg.org/download.html
- Add to PATH

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Running the Application

### Full stack (Docker)

Starts PostgreSQL, Jackett, backend, and frontend (Nginx + Vite build):

```bash
make up
```

Open **http://localhost:5173** — the API is proxied at `/api` on the same host.

The backend is also exposed directly at **http://localhost:3001** (optional debugging).

### Local development (hot reload)

Runs Docker for db, Jackett, and backend; Vite and nodemon on the host:

```bash
make dev
```

- Frontend: `http://localhost:5173` (Vite proxies `/api`, `/subtitles` to `http://localhost:3000`)
- Backend: `http://localhost:3000`

If only the Docker backend is running, set `VITE_PROXY_TARGET=http://localhost:3001` when starting Vite.

### OAuth callback URLs

When using the Docker frontend (Nginx proxy), register these callback URLs with your OAuth providers:

- `http://localhost:5173/api/auth/42/callback`
- `http://localhost:5173/api/auth/google/callback`
- `http://localhost:5173/api/auth/github/callback`

Set matching values in `backend/.env` (`OAUTH_*_CALLBACK_URL`) and `FRONTEND_URL=http://localhost:5173`.

## Project Structure

```
HyperTube/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── database/
│   │   └── schema.sql
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Features to Implement

### Mandatory Features

1. **User Interface**
   - User registration (email, username, first name, last name, password)
   - OAuth login (42 + one additional strategy)
   - Login with username/password
   - Password reset via email
   - User profile management
   - Language preferences

2. **Library**
   - Search functionality (query at least 2 external video sources)
   - Video thumbnails display
   - Pagination with infinite scroll
   - Sorting and filtering
   - Watched/unwatched video differentiation

3. **Video Player**
   - Video details page
   - BitTorrent download and streaming
   - Background download processing
   - Video storage management
   - Automatic cleanup (unwatched videos after 1 month)
   - Subtitles support
   - Video format conversion (MKV to MP4/WebM)

4. **API**
   - RESTful API with OAuth2 authentication
   - User endpoints
   - Movie endpoints
   - Comments endpoints

### Security Requirements

- ✅ Passwords must be hashed (bcrypt)
- ✅ Protection against SQL injection
- ✅ Form validation
- ✅ Protection against XSS
- ✅ Secure file uploads
- ✅ Environment variables for sensitive data

## API Documentation

See the subject PDF for detailed API endpoint specifications.

## Development Notes

- All torrent downloads must happen server-side
- Video streaming must be non-blocking
- The application must be responsive and mobile-friendly
- No errors, warnings, or notices in console
- All forms must have proper validation

## License

This project is part of the 42 curriculum.
