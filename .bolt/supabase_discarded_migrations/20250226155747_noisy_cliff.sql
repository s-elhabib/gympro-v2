/*
  # Clean Database Script

  1. Changes
    - Removes all but 10 members from the database
    - Keeps only essential data for testing
    - Ensures referential integrity
  
  2. Purpose
    - Provides a clean testing environment
    - Reduces database size for better performance
    - Maintains core functionality with minimal data
*/

-- First, delete all attendance records except those for the 10 members we want to keep
DELETE FROM attendance
WHERE member_id NOT IN (
  SELECT id FROM members
  ORDER BY created_at DESC
  LIMIT 10
);

-- Next, delete all payments except those for the 10 members we want to keep
DELETE FROM payments
WHERE member_id NOT IN (
  SELECT id FROM members
  ORDER BY created_at DESC
  LIMIT 10
);

-- Finally, delete all members except the 10 most recently created ones
DELETE FROM members
WHERE id NOT IN (
  SELECT id FROM members
  ORDER BY created_at DESC
  LIMIT 10
);

-- Update the remaining members to have more recognizable names and consistent data
UPDATE members
SET 
  first_name = CASE
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 0) THEN 'John'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 1) THEN 'Jane'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 2) THEN 'Michael'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 3) THEN 'Sarah'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 4) THEN 'David'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 5) THEN 'Emily'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 6) THEN 'Robert'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 7) THEN 'Lisa'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 8) THEN 'James'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 9) THEN 'Emma'
    ELSE first_name
  END,
  last_name = CASE
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 0) THEN 'Smith'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 1) THEN 'Johnson'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 2) THEN 'Williams'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 3) THEN 'Brown'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 4) THEN 'Jones'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 5) THEN 'Miller'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 6) THEN 'Davis'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 7) THEN 'Garcia'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 8) THEN 'Rodriguez'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 9) THEN 'Wilson'
    ELSE last_name
  END,
  email = CASE
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 0) THEN 'john.smith@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 1) THEN 'jane.johnson@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 2) THEN 'michael.williams@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 3) THEN 'sarah.brown@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 4) THEN 'david.jones@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 5) THEN 'emily.miller@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 6) THEN 'robert.davis@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 7) THEN 'lisa.garcia@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 8) THEN 'james.rodriguez@example.com'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 9) THEN 'emma.wilson@example.com'
    ELSE email
  END,
  membership_type = CASE
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 0) THEN 'premium'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 1) THEN 'platinum'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 2) THEN 'basic'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 3) THEN 'premium'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 4) THEN 'platinum'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 5) THEN 'basic'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 6) THEN 'premium'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 7) THEN 'basic'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 8) THEN 'platinum'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 9) THEN 'premium'
    ELSE membership_type
  END,
  status = CASE
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 0) THEN 'active'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 1) THEN 'active'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 2) THEN 'active'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 3) THEN 'active'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 4) THEN 'active'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 5) THEN 'inactive'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 6) THEN 'active'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 7) THEN 'suspended'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 8) THEN 'active'
    WHEN id = (SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 9) THEN 'active'
    ELSE status
  END;

-- Ensure each member has at least one payment record
DO $$
DECLARE
  member_rec RECORD;
  pending_members uuid[];
  overdue_member uuid;
BEGIN
  -- Get IDs for members who should have pending payments
  SELECT array_agg(id) INTO pending_members
  FROM (
    SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 2
    UNION ALL
    SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 5
    UNION ALL
    SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 8
  ) AS subquery;
  
  -- Get ID for member who should have overdue payment
  SELECT id INTO overdue_member
  FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 7;

  FOR member_rec IN SELECT id, membership_type FROM members LOOP
    -- Delete existing payments for this member
    DELETE FROM payments WHERE member_id = member_rec.id;
    
    -- Insert a current payment
    INSERT INTO payments (
      member_id,
      amount,
      payment_date,
      due_date,
      status,
      payment_method,
      notes
    ) VALUES (
      member_rec.id,
      CASE 
        WHEN member_rec.membership_type = 'basic' THEN 49.99
        WHEN member_rec.membership_type = 'premium' THEN 99.99
        ELSE 149.99
      END,
      NOW() - INTERVAL '15 days',
      NOW() + INTERVAL '15 days',
      'paid',
      'credit_card',
      'Monthly membership payment'
    );
    
    -- Insert a previous payment
    INSERT INTO payments (
      member_id,
      amount,
      payment_date,
      due_date,
      status,
      payment_method,
      notes
    ) VALUES (
      member_rec.id,
      CASE 
        WHEN member_rec.membership_type = 'basic' THEN 49.99
        WHEN member_rec.membership_type = 'premium' THEN 99.99
        ELSE 149.99
      END,
      NOW() - INTERVAL '45 days',
      NOW() - INTERVAL '15 days',
      'paid',
      'credit_card',
      'Monthly membership payment'
    );
    
    -- Insert a pending payment for some members
    IF member_rec.id = ANY(pending_members) THEN
      INSERT INTO payments (
        member_id,
        amount,
        payment_date,
        due_date,
        status,
        payment_method,
        notes
      ) VALUES (
        member_rec.id,
        CASE 
          WHEN member_rec.membership_type = 'basic' THEN 49.99
          WHEN member_rec.membership_type = 'premium' THEN 99.99
          ELSE 149.99
        END,
        NOW(),
        NOW() + INTERVAL '30 days',
        'pending',
        'credit_card',
        'Upcoming membership payment'
      );
    END IF;
    
    -- Insert an overdue payment for one member
    IF member_rec.id = overdue_member THEN
      INSERT INTO payments (
        member_id,
        amount,
        payment_date,
        due_date,
        status,
        payment_method,
        notes
      ) VALUES (
        member_rec.id,
        CASE 
          WHEN member_rec.membership_type = 'basic' THEN 49.99
          WHEN member_rec.membership_type = 'premium' THEN 99.99
          ELSE 149.99
        END,
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '15 days',
        'pending',
        'credit_card',
        'Overdue membership payment'
      );
    END IF;
  END LOOP;
END $$;

-- Ensure each member has some attendance records
DO $$
DECLARE
  member_rec RECORD;
  attendance_date timestamp;
  i integer;
  today_attendance_members uuid[];
  current_attendance_member uuid;
BEGIN
  -- Get IDs for members who should have today's attendance
  SELECT array_agg(id) INTO today_attendance_members
  FROM (
    SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 0
    UNION ALL
    SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 3
    UNION ALL
    SELECT id FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 6
  ) AS subquery;
  
  -- Get ID for member who is currently at the gym
  SELECT id INTO current_attendance_member
  FROM members ORDER BY created_at DESC LIMIT 1 OFFSET 1;

  FOR member_rec IN SELECT id FROM members LOOP
    -- Delete existing attendance records for this member
    DELETE FROM attendance WHERE member_id = member_rec.id;
    
    -- Create 5-10 attendance records for each member
    FOR i IN 1..floor(random() * 5 + 5)::int LOOP
      attendance_date := NOW() - (floor(random() * 30)::int || ' days')::interval - (floor(random() * 12)::int || ' hours')::interval;
      
      INSERT INTO attendance (
        member_id,
        check_in_time,
        check_out_time,
        type,
        notes
      ) VALUES (
        member_rec.id,
        attendance_date,
        -- 80% chance of having checked out
        CASE 
          WHEN random() < 0.8 THEN attendance_date + (floor(random() * 120 + 30)::int || ' minutes')::interval
          ELSE NULL
        END,
        CASE 
          WHEN random() < 0.6 THEN 'gym'
          WHEN random() < 0.8 THEN 'class'
          ELSE 'personal_training'
        END,
        CASE 
          WHEN random() < 0.3 THEN 'Regular workout'
          WHEN random() < 0.6 THEN 'Focused on cardio'
          WHEN random() < 0.9 THEN 'Strength training'
          ELSE NULL
        END
      );
    END LOOP;
    
    -- Add a today's attendance for some members
    IF member_rec.id = ANY(today_attendance_members) THEN
      INSERT INTO attendance (
        member_id,
        check_in_time,
        check_out_time,
        type,
        notes
      ) VALUES (
        member_rec.id,
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '30 minutes',
        'gym',
        'Today''s workout'
      );
    END IF;
    
    -- Add a current (in progress) attendance for one member
    IF member_rec.id = current_attendance_member THEN
      INSERT INTO attendance (
        member_id,
        check_in_time,
        check_out_time,
        type,
        notes
      ) VALUES (
        member_rec.id,
        NOW() - INTERVAL '45 minutes',
        NULL,
        'gym',
        'Currently working out'
      );
    END IF;
  END LOOP;
END $$;