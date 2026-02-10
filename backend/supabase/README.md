# Supabase Database Setup

## Instructions

1. Go to your Supabase Dashboard: https://qassaeydofbeqydvkagj.supabase.co
2. Navigate to the SQL Editor
3. Copy and execute the contents of `schema.sql`

## Default Credentials

After running the schema, you can login with:

### Doctor Account
- Email: `abucio_230000001128@uic.edu.ph`
- Password: `12345`

### Admin Account
- Email: `fbangoy_230000001354@uic.edu.ph`
- Password: `12345`

## Database Tables

### doctors
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (TEXT)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `specialization` (VARCHAR)
- `phone` (VARCHAR)
- `license_number` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### admins
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (TEXT)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `role` (VARCHAR)
- `phone` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Security

- Row Level Security (RLS) is enabled on both tables
- Doctors can only view their own profile
- Admins can view all doctors and their own profile
- Passwords are hashed using bcrypt (10 rounds)

## Adding New Users

To add new users, use bcrypt to hash passwords before inserting. Example using Node.js:

```javascript
import bcrypt from 'bcrypt';

const password = 'yourpassword';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

Then insert into the database:

```sql
INSERT INTO doctors (email, password_hash, first_name, last_name, specialization)
VALUES ('newdoctor@hospital.com', 'YOUR_HASHED_PASSWORD', 'First', 'Last', 'Specialty');
```
