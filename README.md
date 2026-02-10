# DocTime - Hospital Management System

Complete setup guide for DocTime with Express.js backend and Supabase database.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (already configured)

---

## 📦 Setup Instructions

### Step 1: Set up Supabase Database

1. **Go to Supabase SQL Editor**
   - Visit: https://qassaeydofbeqydvkagj.supabase.co
   - Navigate to: **SQL Editor** (left sidebar)

2. **Execute Database Schema**
   - Open file: `backend/supabase/schema.sql`
   - Copy all the SQL code
   - Paste into Supabase SQL Editor
   - Click **RUN** to execute

   This will create:
   - ✅ `doctors` table with authentication
   - ✅ `admins` table with authentication
   - ✅ Row Level Security (RLS) policies
   - ✅ Sample users (abucio_230000001128@uic.edu.ph & fbangoy_230000001354@uic.edu.ph)
   - ✅ Indexes and triggers

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Start Backend Server

```bash
npm run dev
```

The backend will start on: **http://localhost:3001**

You should see: `🚀 Server is running on http://localhost:3001`

### Step 4: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 5: Start Frontend Application

```bash
npm run dev
```

The frontend will start on: **http://localhost:5173**

---

## 🔐 Default Login Credentials

After executing the database schema, you can login with:

### Doctor Account
- **Email:** `abucio_230000001128@uic.edu.ph`
- **Password:** `12345`
- **Name:** John Smith
- **Specialization:** Cardiology

### Admin Account
- **Email:** `fbangoy_230000001354@uic.edu.ph`
- **Password:** `12345`
- **Name:** Jane Doe
- **Role:** System Administrator

---

## 🏗️ Project Structure

```
DocTime/
├── backend/                    # Express.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js    # Supabase client config
│   │   ├── routes/
│   │   │   └── auth.js        # Authentication endpoints
│   │   ├── utils/
│   │   │   └── hashPassword.js # Password utility
│   │   └── index.js           # Main server file
│   ├── supabase/
│   │   ├── schema.sql         # Database schema
│   │   └── README.md          # Database docs
│   ├── .env                   # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
└── frontend/                  # React + TypeScript Frontend
    ├── src/
    │   ├── pages/
    │   │   ├── Login.tsx      # Login page (updated)
    │   │   ├── Admin/         # Admin pages
    │   │   └── Doctor/        # Doctor pages
    │   ├── components/        # Reusable components
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## 🔧 Backend API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with email and password.

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
    "id": "uuid-here",
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

#### GET `/api/auth/verify`
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
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

#### GET `/api/health`
Check server status.

**Response:**
```json
{
  "status": "ok",
  "message": "DocTime Backend is running"
}
```

---

## 🗄️ Database Schema

### doctors Table
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- password_hash (TEXT)
- first_name (VARCHAR)
- last_name (VARCHAR)
- specialization (VARCHAR)
- phone (VARCHAR)
- license_number (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### admins Table
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- password_hash (TEXT)
- first_name (VARCHAR)
- last_name (VARCHAR)
- role (VARCHAR)
- phone (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 🔒 Security Features

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **JWT Authentication**: Tokens expire in 24 hours
- ✅ **Row Level Security**: Enabled on all tables
- ✅ **CORS Protection**: Configured for frontend origin
- ✅ **Environment Variables**: Sensitive data in .env file

---

## 🧪 Testing the System

### Test Backend is Running

**Option 1: Browser**
Visit: http://localhost:3001/api/health

**Option 2: PowerShell**
```powershell
(Invoke-WebRequest -Uri http://localhost:3001/api/health -UseBasicParsing).Content
```

### Test Login API

```powershell
$body = @{
    email = "abucio_230000001128@uic.edu.ph"
    password = "12345"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3001/api/auth/login -Method Post -Body $body -ContentType "application/json"
```

### Test Frontend Login

1. Open browser: http://localhost:5173
2. Login with:
   - Email: `abucio_230000001128@uic.edu.ph`
   - Password: `12345`
3. You should be redirected to the Doctor Dashboard

---

## 👥 Adding New Users

### Using Password Hash Utility

```bash
cd backend
node src/utils/hashPassword.js YourPassword123
```

This will output a bcrypt hash. Copy it and use in SQL:

```sql
INSERT INTO doctors (email, password_hash, first_name, last_name, specialization)
VALUES (
  'newdoctor@hospital.com', 
  '$2b$10$...your-hash-here...', 
  'Jane', 
  'Doe', 
  'Neurology'
);
```

---

## 🐛 Troubleshooting

### Backend won't start

1. **Check if port 3001 is in use:**
   ```powershell
   Get-NetTCPConnection -LocalPort 3001
   ```

2. **Kill the process if needed:**
   ```powershell
   Stop-Process -Id <PID> -Force
   ```

3. **Or change the port in `.env`:**
   ```
   PORT=3002
   ```

### Cannot connect to Supabase

1. Verify environment variables in `backend/.env`
2. Check Supabase project status at: https://supabase.com/dashboard
3. Ensure database schema was executed successfully

### Login fails (Invalid credentials)

1. Verify you executed the complete `schema.sql` file
2. Check if sample users were inserted:
   ```sql
   SELECT email FROM doctors;
   SELECT email FROM admins;
   ```

### Frontend can't reach backend

1. Ensure backend is running on port 3001
2. Check browser console for CORS errors
3. Verify fetch URL in Login.tsx: `http://localhost:3001/api/auth/login`

### Database connection errors

1. Check Supabase URL and keys in `.env`
2. Ensure your Supabase project is not paused
3. Verify you have internet connection

---

## 🔄 Development Workflow

### Running Both Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Making Database Changes

1. Update `backend/supabase/schema.sql`
2. Execute the changes in Supabase SQL Editor
3. Restart backend if needed

### Adding New API Endpoints

1. Create/update route files in `backend/src/routes/`
2. Import and use in `backend/src/index.js`
3. Restart backend server

---

## 📝 Environment Variables

### Backend (.env)

```env
SUPABASE_URL=https://qassaeydofbeqydvkagj.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=3001
JWT_SECRET=your-jwt-secret-key
```

⚠️ **Important:** Never commit `.env` to version control. It's already in `.gitignore`.

---

## 🎯 Next Steps

1. ✅ Execute database schema in Supabase
2. ✅ Start backend server
3. ✅ Start frontend application
4. ✅ Test login with default credentials
5. 🔄 Start building additional features:
   - Staff directory
   - Roster generation
   - Leave requests
   - Shift swapping
   - Monthly statistics

---

## 📚 Technologies Used

### Backend
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment configuration

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs in terminal
3. Check browser console for frontend errors
4. Verify Supabase dashboard for database issues

---

## 📄 License

This project is for educational/internal use.

---

**Happy Coding! 🚀**
