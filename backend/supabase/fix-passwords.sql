-- Quick Fix: Update password hashes for admin and doctor accounts
-- Run this in Supabase SQL Editor

-- Update admin password (password: 12345)
UPDATE admins 
SET password_hash = '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i'
WHERE email = 'fbangoy_230000001354@uic.edu.ph';

-- Update doctor password (password: 12345)
UPDATE doctors 
SET password_hash = '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i'
WHERE email = 'abucio_230000001128@uic.edu.ph';

-- Verify the updates
SELECT email, first_name, last_name, 
       substring(password_hash, 1, 20) || '...' as password_hash_preview 
FROM admins 
WHERE email = 'fbangoy_230000001354@uic.edu.ph';

SELECT email, first_name, last_name, 
       substring(password_hash, 1, 20) || '...' as password_hash_preview 
FROM doctors 
WHERE email = 'abucio_230000001128@uic.edu.ph';
