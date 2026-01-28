# Authentication API Endpoints

Base URL: `http://localhost:3000/api/auth`

## Registration

### POST /api/auth/register

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "username123",
  "first_name": "John",
  "last_name": "Doe",
  "password": "password123"
}
```

**Validation:**

- `email`: Must be a valid email format
- `username`: Minimum 3 characters
- `first_name`: Required, minimum 1 character
- `last_name`: Required, minimum 1 character
- `password`: Minimum 8 characters

**Response:**

- `201 Created`: User created successfully
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username123",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
  ```
- `400 Bad Request`: Validation errors or email/username already in use
  ```json
  {
    "errors": [{ "path": "email", "msg": "Invalid email" }]
  }
  ```
  or
  ```json
  {
    "message": "Email already in use"
  }
  ```

**Auth Required:** No

---

## Login

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "username": "username123",
  "password": "password123"
}
```

**Validation:**

- `username`: Minimum 3 characters
- `password`: Minimum 8 characters

**Response:**

- `200 OK`: Login successful
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "message": "Invalid username or password"
  }
  ```

**Auth Required:** No

---

## Password Reset

### POST /api/auth/forgot-password

Request a password reset email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Validation:**

- `email`: Must be a valid email format

**Response:**

- `200 OK`: Reset email sent (or user not found, for security)
  ```json
  {
    "message": "Password reset email sent"
  }
  ```
- `404 Not Found`: User not found (if you return this)
  ```json
  {
    "message": "User not found"
  }
  ```

**Auth Required:** No

---

### POST /api/auth/reset-password/:token

Reset password using token from email.

**URL Parameters:**

- `token`: Reset token from email link

**Request Body:**

```json
{
  "newPassword": "newpassword123"
}
```

**Validation:**

- `newPassword`: Minimum 8 characters

**Response:**

- `200 OK`: Password reset successfully
  ```json
  {
    "message": "Password reset successfully"
  }
  ```
- `400 Bad Request`: Token expired
  ```json
  {
    "message": "Token expired"
  }
  ```
- `404 Not Found`: Invalid token
  ```json
  {
    "message": "Invalid or expired token"
  }
  ```

**Auth Required:** No

---

## OAuth Authentication

### GET /api/auth/42

Initiate 42 OAuth login flow.

**Response:**

- Redirects to 42 login page

**Auth Required:** No

---

### GET /api/auth/42/callback

42 OAuth callback endpoint (handled by Passport).

**Response:**

- On success: Redirects to `FRONTEND_URL/auth/callback?token=...`
- On failure: Redirects to `/login?error=42_auth_failed`

**Auth Required:** No (handled internally by Passport)

**OAuth Flow:**

1. User clicks "Log in with 42" → Frontend redirects to `GET /api/auth/42`
2. User logs in on 42 → 42 redirects back to `/api/auth/42/callback`
3. Backend finds or creates user → Issues JWT token
4. Backend redirects to `FRONTEND_URL/auth/callback?token=<jwt_token>`
5. Frontend extracts token from URL and stores it

---

### GET /api/auth/google

Initiate Google OAuth login flow.

**Response:**

- Redirects to Google login page

**Auth Required:** No

---

### GET /api/auth/google/callback

Google OAuth callback endpoint (handled by Passport).

**Response:**

- On success: Redirects to `FRONTEND_URL/auth/callback?token=...`
- On failure: Redirects to `/login?error=google_auth_failed`

**Auth Required:** No (handled internally by Passport)

**OAuth Flow:**

1. User clicks "Log in with Google" → Frontend redirects to `GET /api/auth/google`
2. User logs in on Google → Google redirects back to `/api/auth/google/callback`
3. Backend finds or creates user → Issues JWT token
4. Backend redirects to `FRONTEND_URL/auth/callback?token=<jwt_token>`
5. Frontend extracts token from URL and stores it

---

## Using the JWT Token

After login or OAuth, include the token in protected requests:

**Header:**

```
Authorization: Bearer <token>
```

Example:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/users/me
```
