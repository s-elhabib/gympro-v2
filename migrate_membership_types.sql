-- SQL script to migrate members from old membership types to new ones
-- This script will:
-- 1. Update all members with 'basic' membership type to 'monthly'
-- 2. Update all members with 'premium' membership type to 'quarterly'
-- 3. Update all members with 'platinum' membership type to 'annual'
-- 4. Print a summary of the changes made

-- Start a transaction so we can roll back if needed
BEGIN;

-- Create a temporary table to store the changes for reporting
CREATE TEMP TABLE membership_type_changes (
    member_id UUID,
    member_name TEXT,
    old_type TEXT,
    new_type TEXT
);

-- Update members with 'basic' membership type to 'monthly'
WITH updated_members AS (
    UPDATE members
    SET membership_type = 'monthly'::membership_type
    WHERE membership_type = 'basic'::membership_type
    RETURNING id, first_name, last_name, 'basic' as old_type, 'monthly' as new_type
)
INSERT INTO membership_type_changes (member_id, member_name, old_type, new_type)
SELECT id, first_name || ' ' || last_name, old_type, new_type
FROM updated_members;

-- Update members with 'premium' membership type to 'quarterly'
WITH updated_members AS (
    UPDATE members
    SET membership_type = 'quarterly'::membership_type
    WHERE membership_type = 'premium'::membership_type
    RETURNING id, first_name, last_name, 'premium' as old_type, 'quarterly' as new_type
)
INSERT INTO membership_type_changes (member_id, member_name, old_type, new_type)
SELECT id, first_name || ' ' || last_name, old_type, new_type
FROM updated_members;

-- Update members with 'platinum' membership type to 'annual'
WITH updated_members AS (
    UPDATE members
    SET membership_type = 'annual'::membership_type
    WHERE membership_type = 'platinum'::membership_type
    RETURNING id, first_name, last_name, 'platinum' as old_type, 'annual' as new_type
)
INSERT INTO membership_type_changes (member_id, member_name, old_type, new_type)
SELECT id, first_name || ' ' || last_name, old_type, new_type
FROM updated_members;

-- Print a summary of the changes
SELECT 'Total members updated: ' || COUNT(*) FROM membership_type_changes;
SELECT 'Members updated from basic to monthly: ' || COUNT(*) FROM membership_type_changes WHERE old_type = 'basic';
SELECT 'Members updated from premium to quarterly: ' || COUNT(*) FROM membership_type_changes WHERE old_type = 'premium';
SELECT 'Members updated from platinum to annual: ' || COUNT(*) FROM membership_type_changes WHERE old_type = 'platinum';

-- Show the details of the changes
SELECT member_name, old_type, new_type FROM membership_type_changes ORDER BY member_name;

-- If everything looks good, commit the transaction
-- If you want to check the changes first, you can comment out the COMMIT and run the script
-- Then, if the changes look good, you can run COMMIT separately
COMMIT;

-- Drop the temporary table
DROP TABLE IF EXISTS membership_type_changes;
