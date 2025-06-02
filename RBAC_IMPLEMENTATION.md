# Role-Based Access Control (RBAC) Implementation

This document describes the simple and efficient Role-Based Access Control system implemented in the GymPro application.

## Overview

The RBAC system restricts staff access to specific modules based on their assigned roles, ensuring proper security and workflow management without affecting application performance.

## Roles and Permissions

### Available Roles

1. **Admin** - Full system access
2. **Manager** - Management-level access (all except settings)
3. **Trainer** - Fitness-focused access
4. **Receptionist** - Front desk operations
5. **Maintenance** - Limited operational access

### Permission Matrix

| Module | Admin | Manager | Trainer | Receptionist | Maintenance |
|--------|-------|---------|---------|--------------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Members | ✅ | ✅ | ✅ | ✅ | ❌ |
| Payments | ✅ | ✅ | ❌ | ✅ | ❌ |
| Attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Classes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

## Implementation Details

### 1. Authentication System
- Users authenticate via Supabase Auth
- User roles are fetched from the `staff` table using email matching
- Only active staff members can access the system

### 2. Permission Checking
- Permissions are defined in `src/types/auth.ts`
- Simple permission checking function: `hasPermission(userRole, module)`
- No complex permission trees or inheritance

### 3. Route Protection
- `ProtectedRoute` component wraps each route
- Checks user permissions before rendering content
- Shows user-friendly unauthorized access message

### 4. UI Filtering
- Sidebar navigation automatically filters based on user role
- No hidden elements that could confuse users
- Clean, role-appropriate interface

## Files Modified/Created

### Core Files
- `src/types/auth.ts` - Role definitions and permission mapping
- `src/components/ProtectedRoute.tsx` - Route-level access control
- `src/context/AuthContext.tsx` - Updated to fetch roles from staff table
- `src/App.tsx` - Added ProtectedRoute to all routes
- `src/components/layout/Sidebar.tsx` - Updated to use permission-based filtering

### Database Files
- `supabase/migrations/20250127000000_add_auth_user_id_to_staff.sql` - Optional auth linking
- `test_rbac_data.sql` - Test data with different roles

## Testing the RBAC System

### 1. Setup Test Data
```sql
-- Run the test data script in Supabase SQL editor
-- This creates 5 test staff members with different roles
```

### 2. Create Auth Accounts
For each test email, create a Supabase auth account:
- admin@gym.com (password: password123)
- manager@gym.com (password: password123)
- trainer@gym.com (password: password123)
- receptionist@gym.com (password: password123)
- maintenance@gym.com (password: password123)

### 3. Test Access Levels
Login with different accounts to verify:
- Sidebar shows only permitted modules
- Direct URL access to restricted modules shows unauthorized message
- User role is displayed in the navbar

## Security Features

### 1. Database Level
- Row Level Security (RLS) policies on staff table
- Only active staff members can access the system
- Email-based user-staff linking

### 2. Application Level
- Route-level protection for all modules
- UI elements filtered based on permissions
- Graceful handling of unauthorized access

### 3. User Experience
- Clear unauthorized access messages
- No confusing hidden elements
- Intuitive role-based navigation

## Performance Considerations

### 1. Minimal Overhead
- Simple permission checking (O(1) lookup)
- No complex permission calculations
- Cached user role in auth context

### 2. Efficient Database Queries
- Single query to fetch user role on login
- No repeated permission checks against database
- Indexed email column for fast lookups

## Maintenance

### Adding New Roles
1. Add role to `UserRole` type in `src/types/auth.ts`
2. Add permissions to `ROLE_PERMISSIONS` mapping
3. Update database enum if needed

### Adding New Modules
1. Add module to permission arrays in `ROLE_PERMISSIONS`
2. Add ProtectedRoute wrapper to new routes
3. Update sidebar menu items

### Modifying Permissions
Simply update the `ROLE_PERMISSIONS` object in `src/types/auth.ts`

## Troubleshooting

### User Can't Login
- Check if user exists in staff table with correct email
- Verify staff status is 'active'
- Check Supabase auth account exists

### Wrong Permissions
- Verify role in staff table matches expected role
- Check `ROLE_PERMISSIONS` mapping
- Clear browser cache/localStorage

### Unauthorized Access Message
- This is expected behavior for restricted modules
- Verify user role has required permission
- Check if route is properly wrapped with ProtectedRoute
