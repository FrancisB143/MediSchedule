# Authentication Flow Documentation

## Overview
The DocTime application uses Supabase database authentication with Express.js backend and React frontend.

## How It Works

### 1. Database Tables (Supabase)
- **`doctors` table**: Stores doctor accounts with email and password_hash
- **`admins` table**: Stores admin accounts with email and password_hash

### 2. Backend Authentication (`/backend/src/routes/auth.js`)

When a user logs in:
1. Backend receives email and password
2. Queries **Supabase `doctors` table** first
3. If not found, queries **Supabase `admins` table**
4. Verifies password using bcrypt
5. Returns JWT token and userType ('doctor' or 'admin')

### 3. Frontend Login (`/frontend/src/pages/Login.tsx`)

The login page:
1. Sends credentials to `http://localhost:3001/api/auth/login`
2. Receives response with:
   - `token`: JWT authentication token
   - `userType`: either 'doctor' or 'admin'
   - `user`: User profile information
3. Stores data in localStorage
4. Calls `onLogin(userType)` to trigger redirect

### 4. Routing Logic (`/frontend/src/App.tsx`)

**On App Load:**
- Checks localStorage for existing token
- Verifies token with backend
- Restores session if valid
- Shows loading spinner during check

**Login Redirects:**
- ✅ **Admin** → `/admin/dashboard` (AdminDashboard component)
- ✅ **Doctor** → `/doctor/schedule` (MySchedule component)

**Protected Routes:**
- Admin routes require `userType === 'admin'`
- Doctor routes require `userType === 'doctor'`
- Unauthorized access redirects to login

### 5. Logout Flow

When user logs out:
1. Clears `authToken` from localStorage
2. Clears `user` from localStorage
3. Clears `userType` from localStorage
4. Redirects to login page

## Testing the System

### 1. Login as Doctor

**Credentials:**
- Email: `abucio_230000001128@uic.edu.ph`
- Password: `12345`

**Expected Result:**
- Redirects to `/doctor/schedule` (MySchedule page)
- Can access all doctor routes

### 2. Login as Admin

**Credentials:**
- Email: `fbangoy_230000001354@uic.edu.ph`
- Password: `12345`

**Expected Result:**
- Redirects to `/admin/dashboard` (AdminDashboard page)
- Can access all admin routes

## Session Persistence

✅ **Persistent Login**: User stays logged in after page refresh
- Token stored in localStorage
- Verified on app mount
- Auto-restores user session

❌ **Invalid Token**: Automatically logs out user
- Expired tokens (24 hours)
- Invalid tokens
- Deleted/modified tokens

## Security Features

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **JWT Tokens**: Expire after 24 hours
3. **Token Verification**: Backend validates on protected endpoints
4. **Supabase RLS**: Row Level Security policies enabled
5. **Protected Routes**: Frontend route guards

## API Endpoints

### POST `/api/auth/login`
Authenticates user against Supabase database.

**Request:**
```json
{
  "email": "abucio_230000001128@uic.edu.ph",
  "password": "12345"
}
```

**Response (Success):**
```json
{
  "success": true,
  "userType": "doctor",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "abucio_230000001128@uic.edu.ph",
    "firstName": "John",
    "lastName": "Smith",
    "specialization": "Cardiology"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid email or password"
}
```

### GET `/api/auth/verify`
Verifies JWT token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "abucio_230000001128@uic.edu.ph",
    "type": "doctor"
  }
}
```

## Troubleshooting

### Cannot Login
1. ✅ Verify backend is running on port 3001
2. ✅ Check database schema was executed in Supabase
3. ✅ Confirm credentials match database records
4. ✅ Check browser console for errors

### Redirects to Wrong Page
1. ✅ Check `userType` in backend response
2. ✅ Verify routing logic in App.tsx
3. ✅ Clear localStorage and try again

### Session Not Persisting
1. ✅ Check localStorage has `authToken` and `userType`
2. ✅ Verify token verification endpoint is working
3. ✅ Check token hasn't expired (24 hour limit)

### "Unable to Connect to Server"
1. ✅ Start backend: `cd backend && npm run dev`
2. ✅ Check port 3001 is not blocked
3. ✅ Verify CORS is enabled in backend

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌─────────────┐                                             │
│  │  Login.tsx  │ ──> POST /api/auth/login                   │
│  └─────────────┘                                             │
│         │                                                     │
│         ↓                                                     │
│  ┌─────────────┐     Store: token, user, userType           │
│  │  App.tsx    │ ──> localStorage                            │
│  └─────────────┘                                             │
│         │                                                     │
│         ↓                                                     │
│  ┌──────────────────────────────────┐                        │
│  │  Route Decision                  │                        │
│  │  - admin → /admin/dashboard      │                        │
│  │  - doctor → /doctor/schedule     │                        │
│  └──────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                       │
                       ↓ HTTP Request
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│  ┌─────────────────────────────────┐                         │
│  │  /api/auth/login (auth.js)      │                         │
│  └─────────────────────────────────┘                         │
│         │                                                     │
│         ↓                                                     │
│  ┌─────────────────────────────────┐                         │
│  │  Query Supabase Database        │                         │
│  │  1. Check doctors table          │                         │
│  │  2. Check admins table           │                         │
│  └─────────────────────────────────┘                         │
│         │                                                     │
│         ↓                                                     │
│  ┌─────────────────────────────────┐                         │
│  │  Verify Password (bcrypt)        │                         │
│  └─────────────────────────────────┘                         │
│         │                                                     │
│         ↓                                                     │
│  ┌─────────────────────────────────┐                         │
│  │  Generate JWT Token              │                         │
│  │  Return: userType, token, user   │                         │
│  └─────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                       │
                       ↓ Supabase API
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                       │
│                                                               │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │  doctors table  │      │  admins table   │              │
│  ├─────────────────┤      ├─────────────────┤              │
│  │ id              │      │ id              │              │
│  │ email           │      │ email           │              │
│  │ password_hash   │      │ password_hash   │              │
│  │ first_name      │      │ first_name      │              │
│  │ last_name       │      │ last_name       │              │
│  │ specialization  │      │ role            │              │
│  └─────────────────┘      └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Summary

✅ **Authentication**: Queries Supabase doctors/admins tables
✅ **Authorization**: JWT tokens with 24-hour expiry
✅ **Redirects**: Admin → dashboard, Doctor → schedule
✅ **Session**: Persistent across page refreshes
✅ **Security**: Bcrypt password hashing, RLS policies

Your application is now fully secured with database-backed authentication! 🔒✨
