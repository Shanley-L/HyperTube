# HyperTube – All phases (self-guided)

Use this file to continue the project step by step, with or without assistance. Tick the checkboxes as you complete each item. Subject reference: `en.subject.txt`.

---

## Rules to respect (subject)

- **Torrent/stream**: Do NOT use webtorrent, pulsar, peerflix. Use lower-level torrent libs and implement download/stream yourself.
- **Security**: No plain-text passwords; parameterized SQL only; validate all forms and uploads; no XSS (no raw user HTML/JS).
- **Eliminatory**: No errors, warnings, or notices in server or browser console.
- **Layout**: Header, main, footer; usable on mobile.
- **Browsers**: Latest Firefox and Chrome.

---

## Phase 1 – User interface (III.1)

### 1.1 Registration
- [ ] Register page: form with email, username, first_name, last_name, password (type="password").
- [ ] Submit → `POST /api/auth/register` with that payload.
- [ ] On 201: redirect to `/login`. On 4xx: show backend `errors` (use `err.param ?? err.path` for field name) and `message`.
- [ ] Submit button inside `<form>`. Link "Already have an account? Log in" to `/login`.

### 1.2 OAuth (42 + Google)
- [ ] Login page: two links (not just buttons) that do full navigation to backend: `/api/auth/42` and `/api/auth/google`. Use `<a href="/api/auth/42">` and same for Google (with proxy, same origin works). Optionally use `VITE_BACKEND_URL` if frontend/backend on different hosts later.
- [ ] OAuth images: import assets (e.g. `import fortyTwoPng from "../assets/42.png"`) and use in `<img src={fortyTwoPng} />` so Vite resolves them.
- [ ] Callback page (`AuthCallBack.jsx`): on mount, read `token` from URL (e.g. `useSearchParams().get('token')`). If token: call `login(token)` from auth context, then `navigate('/', { replace: true })`. If no token or error: `navigate('/login', { replace: true })` (optionally with error in state/query).
- [ ] App: add route `path="/auth/callback"` with the callback page component.
- [ ] Optional: on Login, read `?error=42_auth_failed` or `google_auth_failed` and show a short message.

### 1.3 Login (username + password)
- [ ] Ensure success is detected: check `response.status === 200` (not 2000) and `response.data.token`; then `login(token)` and `navigate('/')`.
- [ ] Map validation errors with `err.param ?? err.path` if needed so field errors show.

### 1.4 Password reset by email
- [ ] Backend: implement `sendEmail` in `backend/utils/email.js` with Nodemailer (SMTP from env). In forgot-password controller, call it with the reset link (`FRONTEND_URL/reset-password?token=...`).
- [ ] Frontend Forgot password page: form with email only; `POST /api/auth/forgot-password` with `{ email }`. Show generic success message (e.g. "If an account exists, you will receive an email").
- [ ] Frontend Reset password page: read `token` from URL (`?token=...`). Form: new password + confirm (client-side match). `POST /api/auth/reset-password/:token` with `{ newPassword }`. On success redirect to `/login`. If no token, show "Invalid or expired link" and link to login/forgot.
- [ ] App: add routes for `/forgot-password` and `/reset-password`.

### 1.5 Logout from any page
- [ ] In header (or layout): if authenticated, show "Hello, {username}" and a Logout button/link that calls `logout()` from auth context and `navigate('/login')`.
- [ ] Ensure header is visible on all pages (e.g. in App layout).

### 1.6 Preferred language
- [ ] Backend: `GET /api/users/me` and `PATCH /api/users/me` (auth required). PATCH accepts at least `preferred_language`. Schema already has `preferred_language` (default 'en').
- [ ] Frontend: profile or settings page with language selector; on change call PATCH and optionally refetch user or update context.

### 1.7 Profile: edit + view others
- [ ] Backend: `GET /api/users/:id` returns public profile (username, profile_picture_url, first_name, last_name, etc.) but NOT email. `PATCH /api/users/me` for authenticated user: allow updating email, profile_picture_url, first_name, last_name, etc. (and language from 1.6).
- [ ] Frontend: "My profile" page with edit form (email, picture, name, language). "View profile" page for `/users/:id` (or `/profile/:id`) showing picture and info, no email.
- [ ] App: add routes for profile (e.g. `/profile` for me, `/profile/:id` or `/users/:id` for others).

---

## Phase 2 – Library (III.2)

### 2.1 Two external video sources
- [ ] Backend service (e.g. `backend/services/sources.js` or similar): call two external APIs (e.g. TMDb, OMDb). Normalize responses to one shape: title, year, id, poster/cover URL, rating (IMDb/OMDb/TMDb), etc.

### 2.2 Search endpoint
- [ ] Backend: e.g. `GET /api/movies/search?q=...&page=...`. Use the two sources, merge/dedupe, paginate. Return list with thumbnails, name, year, rating, stable id per result.

### 2.3 Default list (no search)
- [ ] When no search query: show "most popular" from external sources (subject: sorted by your choice – downloads, peers, seeders, etc.). Backend: endpoint or same search endpoint with empty q returning default/popular list. Frontend: call it when search input is empty.

### 2.4 Thumbnails UI
- [ ] Frontend: grid of movie cards. Each card: cover image, name, year (if available), rating (if available). Link or navigate to movie detail (Phase 3).

### 2.5 Watched vs unwatched
- [ ] Backend: for each movie in list, indicate if current user has watched it (e.g. from `user_movie_watched` or `movies.last_watched_at`). Return a `watched` (or similar) flag.
- [ ] Frontend: differentiate thumbnails (e.g. badge, border, icon) for watched vs unwatched.

### 2.6 Infinite scroll
- [ ] Subject: next page loaded asynchronously as user scrolls; no "next page" link. Frontend: detect scroll near bottom (or use Intersection Observer on a sentinel element); when triggered, request next page (e.g. page+1) and append results to the list.

### 2.7 Sort and filter
- [ ] Backend: search/list endpoint accepts query params for sort (e.g. name, year, rating) and filter (e.g. genre, year range).
- [ ] Frontend: dropdowns or controls for sort and filter; update URL or state and refetch with new params.

---

## Phase 3 – Video (III.3)

### 3.1 Movie detail page
- [ ] Backend: `GET /api/movies/:id` returns full metadata (summary, cast, director, producer, year, length, rating, cover, etc.) from DB and/or external APIs.
- [ ] Frontend: detail page with poster, summary, cast, year, length, rating, and a placeholder for the video player (Phase 3.2–3.3).

### 3.2 Torrent download (server-side)
- [ ] Use an allowed library (e.g. libtorrent bindings). Service that: given a magnet or hash, adds torrent, downloads to a dedicated directory, updates DB (`movies.torrent_hash`, `file_path`, `downloaded`, timestamps). Run in background; non-blocking. Do NOT use webtorrent/peerflix/pulsar for the stream.

### 3.3 Streaming
- [ ] Endpoint e.g. `GET /api/movies/:id/stream`: serve the video file (or stream from torrent) with **Range** header support so the browser can seek. Non-blocking. Frontend: `<video>` with `src` pointing to this endpoint (with auth if needed).

### 3.4 Save when complete; cleanup after 1 month
- [ ] When torrent download completes: set `downloaded = true` in DB, keep file on disk.
- [ ] Scheduled job (cron or in-process): delete files (and optionally DB rows) for movies not watched in the last month (use `last_watched_at` or equivalent). Subject: "if a movie is unwatched for a month, it will be erased."

### 3.5 Subtitles
- [ ] Backend: when English subtitles available, download and store (e.g. in `subtitles` table). If video language != user preferred language and subtitles exist, make them available. Serve subtitles (e.g. VTT).
- [ ] Frontend: video player subtitle track or language menu to select subtitle.

### 3.6 Conversion (MKV → browser format)
- [ ] Subject: if video not natively readable by browser (e.g. MKV), convert on the fly; at least MKV support. Use FFmpeg to convert to MP4 or WebM. Do it in a pipeline or background so it's non-blocking.

### 3.7 Comments on video
- [ ] Backend: `GET /api/movies/:id/comments`, `POST /api/movies/:id/comments` (body: e.g. `{ content }`). Auth required for POST.
- [ ] Frontend: on movie detail page, list of comments and a form to post a comment.

---

## Phase 4 – REST API with OAuth2 (III.4)

Subject: RESTful API with OAuth2; only the documented endpoints are allowed; return appropriate HTTP codes for anything else.

### 4.1 OAuth2 for API
- [ ] `POST /oauth/token` (or `/api/oauth/token`): expects client id + secret; returns access token. Other API routes that require auth use this token (e.g. Bearer). Unauthorized or invalid requests return 401/403.

### 4.2 Users API
- [ ] `GET /users`: list users (id, username). Auth required.
- [ ] `GET /users/:id`: username, email, profile picture URL. Auth required.
- [ ] `PATCH /users/:id`: body username, email, password, profile picture URL. Auth required; enforce ownership or rules per subject.

### 4.3 Front page / movies API
- [ ] `GET /movies`: list of movies on front page (id, name). Any user (or public, per subject).
- [ ] `GET /movies/:id`: name, id, rating, year, length, available subtitles, number of comments.

### 4.4 Comments API
- [ ] `GET /comments`: latest comments (author username, date, content, id). Auth.
- [ ] `GET /comments/:id`: comment, author username, id, date. Auth.
- [ ] `PATCH /comments/:id`: body comment, username. Auth.
- [ ] `DELETE /comments/:id`. Auth.
- [ ] `POST /comments` or `POST /movies/:movie_id/comments`: body comment, movie_id; rest from server. Auth.

### 4.5 API documentation
- [ ] Document all above: base URL, auth (OAuth2 token), request/response shapes, status codes. Keep in sync with code (e.g. `backend/routes/API.md`).

---

## Phase 5 – Security and eliminatory

### 5.1 Security checklist
- [ ] Passwords: only stored hashed (bcrypt).
- [ ] SQL: only parameterized queries (no string concatenation).
- [ ] Forms: validated on backend; optionally on frontend too.
- [ ] Uploads: validate type/size; store with safe names / outside web root.
- [ ] XSS: escape/sanitize user content; avoid `dangerouslySetInnerHTML` with raw user input.

### 5.2 No console errors
- [ ] Remove or guard debug logs. Fix React warnings (keys, hooks, etc.). Handle promise rejections and API errors so nothing uncaught appears in server or browser console.

### 5.3 Responsive + layout
- [ ] Header, main, footer on all relevant pages. CSS/layout works on small viewports; test on mobile or devtools device mode.

---

## Suggested order

1. Phase 1 (all steps 1.1–1.7).
2. Phase 2 (2.1–2.7).
3. Phase 3 (3.1–3.7).
4. Phase 4 (4.1–4.5).
5. Phase 5 (5.1–5.3).

---

## Quick reference – backend routes you have

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password/:token`, `GET /api/auth/42`, `GET /api/auth/42/callback`, `GET /api/auth/google`, `GET /api/auth/google/callback`.
- Add: users (me, :id), movies (search, list, :id, stream), comments; OAuth2 token for external API.

Good luck. You can tick the boxes in this file as you go.
