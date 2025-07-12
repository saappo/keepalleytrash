-- Complete Setup for Keep Alley Trash Supabase Tables
-- Run this in your Supabase SQL Editor

-- 1. Create KATnewsletter table
CREATE TABLE IF NOT EXISTS KATnewsletter (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create KATcontactUSonly table
CREATE TABLE IF NOT EXISTS KATcontactUSonly (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create posts table for community posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON KATnewsletter(email);
CREATE INDEX IF NOT EXISTS idx_contact_email ON KATcontactUSonly(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 6. Disable RLS on public tables (newsletter and contact)
ALTER TABLE KATnewsletter DISABLE ROW LEVEL SECURITY;
ALTER TABLE KATcontactUSonly DISABLE ROW LEVEL SECURITY;

-- 7. Enable RLS on user data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for users table
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- 9. Create RLS policies for posts table
DROP POLICY IF EXISTS "Service role can manage all posts" ON posts;
CREATE POLICY "Service role can manage all posts" ON posts
    FOR ALL USING (auth.role() = 'service_role');

-- 10. Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Verify all tables were created
SELECT 
    table_name,
    rowsecurity
FROM information_schema.tables 
WHERE table_name IN ('KATnewsletter', 'KATcontactUSonly', 'users', 'posts')
ORDER BY table_name; 