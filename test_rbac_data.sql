/*
  Test data for Role-Based Access Control (RBAC) system
  
  This script creates test staff members with different roles to test the RBAC system:
  - admin@gym.com (Admin) - Full access
  - manager@gym.com (Manager) - Most modules except settings
  - trainer@gym.com (Trainer) - Limited to dashboard, members, attendance, classes
  - receptionist@gym.com (Receptionist) - Dashboard, members, payments, attendance
  - maintenance@gym.com (Maintenance) - Only dashboard and attendance
  
  Password for all test accounts: "password123"
  
  Instructions:
  1. Run this script in your Supabase SQL editor
  2. Create Supabase auth accounts manually for each email with password "password123"
  3. Test login with different roles to see different access levels
*/

-- Clear existing test staff (optional - remove if you want to keep existing data)
DELETE FROM staff WHERE email IN (
  'admin@gym.com',
  'manager@gym.com', 
  'trainer@gym.com',
  'receptionist@gym.com',
  'maintenance@gym.com'
);

-- Insert test staff members with different roles
INSERT INTO staff (
  first_name, 
  last_name, 
  email, 
  phone, 
  role, 
  hire_date, 
  status, 
  notes,
  created_at,
  updated_at
) VALUES
  (
    'Admin', 
    'User', 
    'admin@gym.com', 
    '0600000001', 
    'admin'::staff_role, 
    '2024-01-01', 
    'active'::staff_status, 
    'System administrator with full access to all modules',
    NOW(),
    NOW()
  ),
  (
    'Manager', 
    'User', 
    'manager@gym.com', 
    '0600000002', 
    'manager'::staff_role, 
    '2024-01-01', 
    'active'::staff_status, 
    'Gym manager with access to most modules except settings',
    NOW(),
    NOW()
  ),
  (
    'Trainer', 
    'User', 
    'trainer@gym.com', 
    '0600000003', 
    'trainer'::staff_role, 
    '2024-01-01', 
    'active'::staff_status, 
    'Fitness trainer with access to classes, members, and attendance',
    NOW(),
    NOW()
  ),
  (
    'Receptionist', 
    'User', 
    'receptionist@gym.com', 
    '0600000004', 
    'receptionist'::staff_role, 
    '2024-01-01', 
    'active'::staff_status, 
    'Front desk staff with access to members, payments, and attendance',
    NOW(),
    NOW()
  ),
  (
    'Maintenance', 
    'User', 
    'maintenance@gym.com', 
    '0600000005', 
    'maintenance'::staff_role, 
    '2024-01-01', 
    'active'::staff_status, 
    'Maintenance staff with limited access to dashboard and attendance only',
    NOW(),
    NOW()
  );

-- Display the created staff members
SELECT 
  first_name || ' ' || last_name AS name,
  email,
  role,
  status,
  notes
FROM staff 
WHERE email IN (
  'admin@gym.com',
  'manager@gym.com', 
  'trainer@gym.com',
  'receptionist@gym.com',
  'maintenance@gym.com'
)
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'trainer' THEN 3
    WHEN 'receptionist' THEN 4
    WHEN 'maintenance' THEN 5
  END;

-- Show role permissions for reference
SELECT 
  'admin' as role,
  'dashboard, members, payments, attendance, classes, staff, reports, settings' as permissions
UNION ALL
SELECT 
  'manager' as role,
  'dashboard, members, payments, attendance, classes, staff, reports' as permissions
UNION ALL
SELECT 
  'trainer' as role,
  'dashboard, members, attendance, classes' as permissions
UNION ALL
SELECT 
  'receptionist' as role,
  'dashboard, members, payments, attendance' as permissions
UNION ALL
SELECT 
  'maintenance' as role,
  'dashboard, attendance' as permissions;
