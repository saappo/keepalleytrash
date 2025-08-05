-- Fix "Unrestricted" warning for KATnewsletter and KATcontactUSonly tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on both tables
ALTER TABLE KATnewsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE KATcontactUSonly ENABLE ROW LEVEL SECURITY;

-- KATnewsletter policies
-- Allow anyone to insert (for newsletter signups)
CREATE POLICY "Anyone can subscribe to newsletter" ON KATnewsletter
    FOR INSERT WITH CHECK (true);

-- Allow service role to read all newsletter subscribers (for sending emails)
CREATE POLICY "Service role can read all newsletter subscribers" ON KATnewsletter
    FOR SELECT USING (auth.role() = 'service_role');

-- Allow service role to update newsletter subscribers (for unsubscribing, etc.)
CREATE POLICY "Service role can update newsletter subscribers" ON KATnewsletter
    FOR UPDATE USING (auth.role() = 'service_role');

-- Allow service role to delete newsletter subscribers
CREATE POLICY "Service role can delete newsletter subscribers" ON KATnewsletter
    FOR DELETE USING (auth.role() = 'service_role');

-- KATcontactUSonly policies
-- Allow anyone to insert (for contact form submissions)
CREATE POLICY "Anyone can submit contact form" ON KATcontactUSonly
    FOR INSERT WITH CHECK (true);

-- Allow service role to read all contact submissions
CREATE POLICY "Service role can read all contact submissions" ON KATcontactUSonly
    FOR SELECT USING (auth.role() = 'service_role');

-- Allow service role to update contact submissions (for marking as read, etc.)
CREATE POLICY "Service role can update contact submissions" ON KATcontactUSonly
    FOR UPDATE USING (auth.role() = 'service_role');

-- Allow service role to delete contact submissions
CREATE POLICY "Service role can delete contact submissions" ON KATcontactUSonly
    FOR DELETE USING (auth.role() = 'service_role');

-- Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('KATnewsletter', 'KATcontactUSonly', 'users', 'posts')
ORDER BY tablename;

-- Show policies for each table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('KATnewsletter', 'KATcontactUSonly')
ORDER BY tablename, policyname; 