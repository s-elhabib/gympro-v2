-- Clear Database Script
-- This script will delete all existing data from all tables

-- Disable triggers temporarily to avoid issues with foreign key constraints
SET session_replication_role = 'replica';

-- Delete data from tables with foreign key dependencies first
DELETE FROM class_enrollments;
DELETE FROM attendance;
DELETE FROM payments;
DELETE FROM revenue_logs;
DELETE FROM attendance_stats;

-- Delete data from main tables
DELETE FROM classes;
DELETE FROM members;
DELETE FROM staff;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Add gender and birth_date columns to members table if they don't exist
DO $$
BEGIN
    -- Add gender column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'gender'
    ) THEN
        ALTER TABLE members ADD COLUMN gender text;
    END IF;

    -- Add birth_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'birth_date'
    ) THEN
        ALTER TABLE members ADD COLUMN birth_date date;
    END IF;
END $$;

-- Verify all tables are empty
SELECT 'Members: ' || COUNT(*) FROM members;
SELECT 'Staff: ' || COUNT(*) FROM staff;
SELECT 'Classes: ' || COUNT(*) FROM classes;
SELECT 'Payments: ' || COUNT(*) FROM payments;
SELECT 'Attendance Records: ' || COUNT(*) FROM attendance;
SELECT 'Class Enrollments: ' || COUNT(*) FROM class_enrollments;
SELECT 'Attendance Stats: ' || COUNT(*) FROM attendance_stats;
SELECT 'Revenue Logs: ' || COUNT(*) FROM revenue_logs;

-- Output success message
SELECT 'Database cleared successfully. All tables are now empty.' AS result;
