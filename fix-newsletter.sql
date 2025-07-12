-- Fix KATnewsletter table schema
-- Run this in your Supabase SQL Editor

-- Add the missing subscribed_at column to KATnewsletter
ALTER TABLE KATnewsletter 
ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have a subscribed_at value
UPDATE KATnewsletter 
SET subscribed_at = NOW() 
WHERE subscribed_at IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'KATnewsletter'
ORDER BY ordinal_position; 