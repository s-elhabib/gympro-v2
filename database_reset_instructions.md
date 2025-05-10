# Database Reset Instructions

This document provides instructions on how to clear your database and populate it with test data.

## Files Included

1. `clear_database.sql` - Script to delete all data from the database and add any missing columns
2. `populate_test_data.sql` - Script to add 5 test users and associated data

## Important Notes

- The `clear_database.sql` script will check for and add the `gender` and `birth_date` columns to the members table if they don't exist
- If you encounter any errors about missing columns, make sure to run the `clear_database.sql` script first

## How to Use These Scripts

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Navigate to your project (the one with URL https://lijzmstgvrkaetrqlkqa.supabase.co)
3. Go to the SQL Editor
4. Copy and paste the content of `clear_database.sql` into the SQL Editor
5. Run the script to clear all data and add any missing columns
6. Copy and paste the content of `populate_test_data.sql` into the SQL Editor
7. Run the script to populate the database with test data

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
# Clear the database and add missing columns
supabase db execute --file clear_database.sql

# Populate with test data
supabase db execute --file populate_test_data.sql
```

### Option 3: Using psql (if you have direct database access)

```bash
# Connect to your database
psql -h <host> -p <port> -d <database> -U <username>

# Run the scripts
\i clear_database.sql
\i populate_test_data.sql
```

### Troubleshooting

If you encounter errors like "column 'gender' does not exist" or "column 'birth_date' does not exist", make sure to run the `clear_database.sql` script first, as it adds these columns if they don't exist.

If you encounter errors like "column reference 'member_id' is ambiguous", this has been fixed in the latest version of the scripts. Make sure you're using the most recent version.

If you're still having issues, you can manually add the missing columns with these SQL commands:

```sql
-- Add missing columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_date date;
```

## Test Data Overview

The `populate_test_data.sql` script adds:

### Members (5)

- Mohammed Alami (Premium)
- Fatima Benali (Basic)
- Youssef Mansouri (Platinum)
- Amina Tazi (Premium)
- Karim Idrissi (Basic, Inactive)

### Staff (3)

- Ahmed Berrada (Admin)
- Salma Kabbaj (Trainer)
- Rachid Moussaoui (Trainer)

### Classes (5)

- Power Yoga (Monday)
- Cours de Velo (Tuesday)
- Entrainement HIIT (Wednesday)
- Pilates Base (Thursday)
- Zumba (Friday)

### Other Data

- Payments (current month, previous month, and some overdue)
- Attendance records (for the past week)
- Class enrollments
- Attendance statistics
- Revenue logs

## Verification

After running the scripts, you should see a count of records in each table to verify the data was inserted correctly.

## Notes

- These scripts are designed to work with the current database schema
- The `clear_database.sql` script temporarily disables triggers to avoid foreign key constraint issues
- All data is randomly generated and suitable for testing purposes only
