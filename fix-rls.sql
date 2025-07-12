-- Fix RLS policies for Keep Alley Trash
-- Run this in your Supabase SQL Editor

-- Disable RLS on KATnewsletter to allow public subscriptions
ALTER TABLE KATnewsletter DISABLE ROW LEVEL SECURITY;

-- Disable RLS on KATcontactUSonly to allow public submissions
ALTER TABLE KATcontactUSonly DISABLE ROW LEVEL SECURITY;

-- For users table, allow service role to manage all users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create simple policy for users table
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- For posts table, allow service role to manage all posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage all posts" ON posts;

-- Create simple policy for posts table
CREATE POLICY "Service role can manage all posts" ON posts
    FOR ALL USING (auth.role() = 'service_role');

-- Verify the changes
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'posts', 'KATnewsletter', 'KATcontactUSonly'); 