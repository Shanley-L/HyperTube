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

**Note:** Pour un guide d'installation détaillé, voir [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

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

### Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The backend will run on `http://localhost:3000`
The frontend will run on `http://localhost:5173`

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
