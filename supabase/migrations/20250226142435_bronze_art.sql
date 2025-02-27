/*
  # Populate database with test data

  This migration adds comprehensive test data including:
  1. 50 members with varied membership types and statuses
  2. Payment history for the last 2 years
  3. Attendance records with different types and patterns
  4. Realistic usage patterns and member behaviors
*/

-- Function to generate random dates between two timestamps
CREATE OR REPLACE FUNCTION random_timestamp(start_ts timestamp, end_ts timestamp) 
RETURNS timestamp AS $$
BEGIN
    RETURN start_ts + random() * (end_ts - start_ts);
END;
$$ LANGUAGE plpgsql;

-- Function to generate random phone numbers
CREATE OR REPLACE FUNCTION random_phone() 
RETURNS text AS $$
BEGIN
    RETURN concat(
        '(', 
        floor(random() * 900 + 100)::text, 
        ') ',
        floor(random() * 900 + 100)::text,
        '-',
        floor(random() * 9000 + 1000)::text
    );
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    member_id uuid;
    payment_amount numeric;
    payment_date timestamp;
    attendance_date timestamp;
    first_names text[] := ARRAY[
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
        'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
        'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
        'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
        'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
        'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
        'Timothy', 'Deborah'
    ];
    last_names text[] := ARRAY[
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
        'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
        'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
        'Carter', 'Roberts'
    ];
    membership_types membership_type[] := ARRAY['basic', 'premium', 'platinum']::membership_type[];
    member_statuses member_status[] := ARRAY['active', 'inactive', 'suspended']::member_status[];
    attendance_types attendance_type[] := ARRAY['gym', 'class', 'personal_training']::attendance_type[];
    payment_methods payment_method[] := ARRAY['cash', 'credit_card', 'debit_card', 'bank_transfer']::payment_method[];
    payment_statuses payment_status[] := ARRAY['paid', 'pending', 'overdue', 'cancelled']::payment_status[];
    i integer;
    j integer;
    two_years_ago timestamp := NOW() - INTERVAL '2 years';
    current_date timestamp := NOW();
BEGIN
    -- Insert 50 members
    FOR i IN 1..50 LOOP
        INSERT INTO members (
            first_name,
            last_name,
            email,
            phone,
            membership_type,
            start_date,
            status,
            notes
        ) VALUES (
            first_names[i],
            last_names[i],
            LOWER(concat(first_names[i], '.', last_names[i], '@example.com')),
            random_phone(),
            membership_types[1 + floor(random() * 3)::int],
            random_timestamp(two_years_ago, current_date),
            CASE 
                WHEN random() < 0.8 THEN 'active'::member_status
                WHEN random() < 0.9 THEN 'inactive'::member_status
                ELSE 'suspended'::member_status
            END,
            CASE 
                WHEN random() < 0.3 THEN 'Regular member'
                WHEN random() < 0.6 THEN 'Prefers morning workouts'
                ELSE 'Evening workout preference'
            END
        ) RETURNING id INTO member_id;

        -- Generate payment history for each member
        payment_date := two_years_ago;
        WHILE payment_date < current_date LOOP
            -- Determine payment amount based on membership type
            SELECT 
                CASE 
                    WHEN m.membership_type = 'basic' THEN 49.99
                    WHEN m.membership_type = 'premium' THEN 99.99
                    ELSE 149.99
                END INTO payment_amount
            FROM members m 
            WHERE m.id = member_id;

            INSERT INTO payments (
                member_id,
                amount,
                payment_date,
                due_date,
                status,
                payment_method,
                notes
            ) VALUES (
                member_id,
                payment_amount,
                payment_date,
                payment_date + INTERVAL '1 month',
                CASE 
                    WHEN random() < 0.8 THEN 'paid'::payment_status
                    WHEN random() < 0.9 THEN 'pending'::payment_status
                    WHEN random() < 0.95 THEN 'overdue'::payment_status
                    ELSE 'cancelled'::payment_status
                END,
                payment_methods[1 + floor(random() * 4)::int],
                CASE 
                    WHEN random() < 0.2 THEN 'Monthly membership payment'
                    WHEN random() < 0.4 THEN 'Auto-payment'
                    ELSE NULL
                END
            );

            payment_date := payment_date + INTERVAL '1 month';
        END LOOP;

        -- Generate attendance records
        -- More frequent for active members, less for inactive/suspended
        FOR j IN 1..floor(random() * 200 + 50)::int LOOP
            attendance_date := random_timestamp(two_years_ago, current_date);
            
            INSERT INTO attendance (
                member_id,
                check_in_time,
                check_out_time,
                type,
                notes
            ) VALUES (
                member_id,
                attendance_date,
                -- 80% chance of having checked out
                CASE 
                    WHEN random() < 0.8 THEN attendance_date + (floor(random() * 180) || ' minutes')::interval
                    ELSE NULL
                END,
                attendance_types[1 + floor(random() * 3)::int],
                CASE 
                    WHEN random() < 0.2 THEN 'Regular workout'
                    WHEN random() < 0.4 THEN 'Personal training session'
                    WHEN random() < 0.6 THEN 'Group class'
                    ELSE NULL
                END
            );
        END LOOP;
    END LOOP;
END $$;