-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20),
    license_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAM    P
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Insert sample doctor (password is '12345' hashed with bcrypt)
-- Note: In production, passwords should be hashed on the server
INSERT INTO doctors (email, password_hash, first_name, last_name, specialization, phone)
VALUES (
    'abucio_230000001128@uic.edu.ph',
    '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i',
    'John',
    'Smith',
    'Cardiology',
    '555-0101'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample admin (password is '12345' hashed with bcrypt)
INSERT INTO admins (email, password_hash, first_name, last_name, role, phone)
VALUES (
    'fbangoy_230000001354@uic.edu.ph',
    '$2b$10$u8vC.JaGsjZIWXcwm9.T7ec5X.Gw15ag./cC8jTSKdvU9pC4zXm9i',
    'Jane',
    'Doe',
    'System Administrator',
    '555-0102'
) ON CONFLICT (email) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Doctors can read their own data
CREATE POLICY "Doctors can view own profile"
    ON doctors FOR SELECT
    USING (auth.uid()::text = id::text);

-- Admins can read all doctors
CREATE POLICY "Admins can view all doctors"
    ON doctors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE auth.uid()::text = admins.id::text
        )
    );

-- Admins can view own profile
CREATE POLICY "Admins can view own profile"
    ON admins FOR SELECT
    USING (auth.uid()::text = id::text);
