/*
  Create test auth users for RBAC testing
  
  This script creates Supabase auth users that correspond to the staff records
  created in test_rbac_data.sql
  
  IMPORTANT: This script uses Supabase's internal auth functions.
  Run this in the Supabase SQL Editor with RLS disabled for auth schema.
  
  Test accounts created:
  - admin@gym.com (password: password123)
  - manager@gym.com (password: password123)
  - trainer@gym.com (password: password123)
  - receptionist@gym.com (password: password123)
  - maintenance@gym.com (password: password123)
*/

-- Temporarily disable RLS for auth operations (admin only)
-- Note: This should only be run by database administrators

-- Insert test users into auth.users table
-- The passwords will be hashed automatically by Supabase
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@gym.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'manager@gym.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Manager User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'trainer@gym.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Trainer User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'receptionist@gym.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Receptionist User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'maintenance@gym.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Maintenance User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  )
ON CONFLICT (email) DO NOTHING;

-- Create corresponding identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN (
  'admin@gym.com',
  'manager@gym.com',
  'trainer@gym.com',
  'receptionist@gym.com',
  'maintenance@gym.com'
)
ON CONFLICT (provider, user_id) DO NOTHING;

-- Verify the users were created
SELECT 
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users 
WHERE email IN (
  'admin@gym.com',
  'manager@gym.com',
  'trainer@gym.com',
  'receptionist@gym.com',
  'maintenance@gym.com'
)
ORDER BY email;
