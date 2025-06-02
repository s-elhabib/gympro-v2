-- Simple script to create test users
-- Run this in Supabase SQL Editor

-- First, make sure we have the staff records
-- (Run test_rbac_data.sql first if you haven't already)

-- Check if staff records exist
SELECT email, role, status FROM staff 
WHERE email IN (
  'admin@gym.com',
  'manager@gym.com',
  'trainer@gym.com',
  'receptionist@gym.com',
  'maintenance@gym.com'
);

-- If the above query returns empty results, run test_rbac_data.sql first

-- Note: Creating auth users via SQL is complex and requires admin privileges
-- The recommended approach is to use the Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Enter email and password
-- 4. Check "Auto Confirm User"
-- 5. Click "Create user"

-- Alternatively, you can use the Supabase CLI or Admin API
-- But the dashboard method is the most straightforward
