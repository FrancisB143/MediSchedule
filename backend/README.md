# DocTime Backend

Express.js backend with Supabase integration for the DocTime Hospital Management System.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already configured with your Supabase credentials:
- SUPABASE_URL: https://qassaeydofbeqydvkagj.supabase.co
- SUPABASE_ANON_KEY: Your anon public key
- SUPABASE_JWT_SECRET: Your JWT secret
- PORT: 3001

#### Email Configuration (for Staff Management)

To enable email functionality for sending temporary passwords to new staff members:

1. **Set up Gmail App Password:**
   - Enable 2-factor authentication on your Google account
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Navigate to "Security" → "Signing in to Google" → "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password (ignore spaces)

2. **Update .env file:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

**Note:** Never use your regular Gmail password. Always use an App Password for security.

### 3. Set up Database Schema

1. Go to your Supabase Dashboard: https://qassaeydofbeqydvkagj.supabase.co
2. Navigate to **SQL Editor** section
3. Copy the contents of `supabase/schema.sql`
4. Paste and execute in the SQL Editor

This will create:
- `doctors` table
- `admins` table
- Sample users with credentials
- Row Level Security policies
- Indexes and triggers

### 4. Start the Server

```bash
npm run dev
```

The server will start on http://localhost:3001

### 5. Test the API

Health check:
```bash
curl http://localhost:3001/api/health
```

Login test:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"abucio_230000001128@uic.edu.ph","password":"12345"}'
```

## Default Credentials

### Doctor Account
- Email: `abucio_230000001128@uic.edu.ph`
- Password: `12345`

### Admin Account
- Email: `fbangoy_230000001354@uic.edu.ph`
- Password: `12345`

## API Endpoints

### Authentication

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "abucio_230000001128@uic.edu.ph",
  "password": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "userType": "doctor",
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "abucio_230000001128@uic.edu.ph",
    "firstName": "John",
    "lastName": "Smith",
    "specialization": "Cardiology"
  }
}
```

#### GET /api/auth/verify
Verify JWT token.

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

### Health Check

#### GET /api/health
Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "DocTime Backend is running"
}
```

## Adding New Users

To add new users, you can use the password hashing utility:

```bash
node src/utils/hashPassword.js yourpassword
```

This will output a bcrypt hash that you can use in SQL insert statements.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js       # Supabase client configuration
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── staff.js           # Staff management routes
│   │   ├── shifts.js          # Shift management routes
│   │   ├── leave-requests.js  # Leave request routes
│   │   └── shift-swap.js      # Shift swap routes
│   ├── services/
│   │   └── emailService.js    # Email sending service
│   ├── utils/
│   │   └── hashPassword.js    # Password hashing utility
│   └── index.js               # Main application file
├── supabase/
│   ├── schema.sql             # Database schema
│   └── README.md              # Database setup instructions
├── .env                       # Environment variables
├── .gitignore
└── package.json
```

## Security Notes

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 24 hours
- Row Level Security (RLS) is enabled on all tables
- Never commit the `.env` file to version control
- In production, use strong JWT secrets and rotate them regularly

## Troubleshooting

### Port already in use
If port 3001 is already in use, change the PORT in `.env`:
```
PORT=3002
```

### Cannot connect to Supabase
- Verify your SUPABASE_URL and SUPABASE_ANON_KEY in `.env`
- Check if your Supabase project is active
- Ensure you've run the schema.sql in your Supabase SQL Editor

### Login fails after setting up database
- Make sure you've executed the complete `schema.sql` file
- Verify the sample users were inserted correctly
- Check the server logs for detailed error messages
