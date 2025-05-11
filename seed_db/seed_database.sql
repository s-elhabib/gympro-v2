-- Reset Database Script
-- This script will delete all existing data and populate the database with sample data

-- First, delete all existing data
-- DELETE FROM revenue_logs;
-- DELETE FROM attendance_stats;
-- DELETE FROM attendance;
-- DELETE FROM payments;
-- DELETE FROM staff;
-- DELETE FROM members;

-- Reset sequences (if any)
-- ALTER SEQUENCE members_id_seq RESTART WITH 1;
-- ALTER SEQUENCE staff_id_seq RESTART WITH 1;
-- ALTER SEQUENCE payments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE attendance_id_seq RESTART WITH 1;

-- Make sure membership types exist by deleting and recreating them
DELETE FROM membership_types WHERE type IN ('monthly', 'quarterly', 'annual', 'day_pass');

INSERT INTO membership_types (type, price, duration) VALUES
('monthly', 200, 30),
('quarterly', 350, 90),
('annual', 500, 365),
('day_pass', 50, 1);

-- Insert 10 sample members
-- For the membership_type column, we need to use the enum values (basic, premium, platinum)
-- that match the database schema, not the string values from the membership_types table
INSERT INTO members (id, first_name, last_name, email, phone, gender, birth_date, membership_type, start_date, status, notes, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Mohammed', 'Alami', 'mohammed.alami1@example.com', '0612345678', 'male', '1990-05-15', 'premium'::membership_type, '2023-10-01', 'active'::member_status, 'Regular gym-goer, interested in personal training', NOW(), NOW()),
  (gen_random_uuid(), 'Fatima', 'Benali', 'fatima.benali1@example.com', '0623456789', 'female', '1988-08-22', 'basic'::membership_type, '2023-11-15', 'active'::member_status, 'Prefers morning classes', NOW(), NOW()),
  (gen_random_uuid(), 'Youssef', 'Mansouri', 'youssef.m1@example.com', '0634567890', 'male', '1995-03-10', 'platinum'::membership_type, '2023-09-05', 'active'::member_status, 'Training for marathon', NOW(), NOW()),
  (gen_random_uuid(), 'Amina', 'Tazi', 'amina.tazi1@example.com', '0645678901', 'female', '1992-12-03', 'premium'::membership_type, '2024-01-10', 'active'::member_status, 'Interested in yoga classes', NOW(), NOW()),
  (gen_random_uuid(), 'Karim', 'Idrissi', 'karim.idrissi1@example.com', '0656789012', 'male', '1985-07-28', 'basic'::membership_type, '2023-08-20', 'inactive'::member_status, 'Temporarily suspended due to travel', NOW(), NOW()),
  (gen_random_uuid(), 'Layla', 'Bouazizi', 'layla.b1@example.com', '0667890123', 'female', '1993-04-17', 'premium'::membership_type, '2024-02-05', 'active'::member_status, 'Prefers evening sessions', NOW(), NOW()),
  (gen_random_uuid(), 'Omar', 'Benjelloun', 'omar.b1@example.com', '0678901234', 'male', '1987-11-09', 'platinum'::membership_type, '2023-07-12', 'active'::member_status, 'Professional athlete', NOW(), NOW()),
  (gen_random_uuid(), 'Nadia', 'El Fassi', 'nadia.elfassi1@example.com', '0689012345', 'female', '1991-02-25', 'basic'::membership_type, '2024-03-01', 'active'::member_status, 'New member, first-time gym user', NOW(), NOW()),
  (gen_random_uuid(), 'Hassan', 'Chraibi', 'hassan.c1@example.com', '0690123456', 'male', '1989-09-14', 'premium'::membership_type, '2023-12-10', 'active'::member_status, 'Focuses on weight training', NOW(), NOW()),
  (gen_random_uuid(), 'Samira', 'Ziani', 'samira.z1@example.com', '0601234567', 'female', '1994-06-30', 'basic'::membership_type, '2024-01-25', 'active'::member_status, 'Interested in nutrition advice', NOW(), NOW());

-- Store member IDs for later use
DO $$
DECLARE
  member_ids UUID[] := ARRAY(SELECT id FROM members ORDER BY created_at);
  member_id UUID;
BEGIN
  -- Insert staff members
  INSERT INTO staff (id, first_name, last_name, email, phone, role, hire_date, status, notes, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Ahmed', 'Berrada', 'ahmed.berrada1@gym.com', '0712345678', 'admin'::staff_role, '2022-01-15', 'active'::staff_status, 'Gym manager', NOW(), NOW()),
    (gen_random_uuid(), 'Salma', 'Kabbaj', 'salma.kabbaj1@gym.com', '0723456789', 'trainer'::staff_role, '2022-03-10', 'active'::staff_status, 'Yoga and fitness instructor', NOW(), NOW()),
    (gen_random_uuid(), 'Rachid', 'Moussaoui', 'rachid.m1@gym.com', '0734567890', 'trainer'::staff_role, '2022-05-20', 'active'::staff_status, 'Strength training specialist', NOW(), NOW()),
    (gen_random_uuid(), 'Leila', 'Haddad', 'leila.h1@gym.com', '0745678901', 'receptionist'::staff_role, '2022-08-05', 'active'::staff_status, 'Front desk, morning shift', NOW(), NOW()),
    (gen_random_uuid(), 'Hamid', 'Ouazzani', 'hamid.o1@gym.com', '0756789012', 'maintenance'::staff_role, '2022-10-12', 'active'::staff_status, 'Equipment maintenance', NOW(), NOW());

  -- Insert payments for each member
  FOREACH member_id IN ARRAY member_ids
  LOOP
    -- Current month payment (paid)
    INSERT INTO payments (id, member_id, amount, payment_date, due_date, payment_method, status, notes, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      member_id,
      (CASE
        WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'basic' THEN
          COALESCE((SELECT price FROM membership_types WHERE type = 'monthly'), 200)
        WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'premium' THEN
          COALESCE((SELECT price FROM membership_types WHERE type = 'quarterly'), 350)
        WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'platinum' THEN
          COALESCE((SELECT price FROM membership_types WHERE type = 'annual'), 500)
        ELSE
          200 -- Default to 200 if unknown
      END),
      NOW() - INTERVAL '5 days',
      NOW() + INTERVAL '25 days',
      (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
      'paid'::payment_status,
      'Monthly membership payment',
      NOW(),
      NOW()
    );

    -- Previous month payment (paid)
    INSERT INTO payments (id, member_id, amount, payment_date, due_date, payment_method, status, notes, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      member_id,
      (CASE
        WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'basic' THEN
          COALESCE((SELECT price FROM membership_types WHERE type = 'monthly'), 200)
        WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'premium' THEN
          COALESCE((SELECT price FROM membership_types WHERE type = 'quarterly'), 350)
        WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'platinum' THEN
          COALESCE((SELECT price FROM membership_types WHERE type = 'annual'), 500)
        ELSE
          200 -- Default to 200 if unknown
      END),
      NOW() - INTERVAL '35 days',
      NOW() - INTERVAL '5 days',
      (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
      'paid'::payment_status,
      'Monthly membership payment',
      NOW() - INTERVAL '35 days',
      NOW() - INTERVAL '35 days'
    );

    -- Add a pending payment for some members
    IF random() < 0.3 THEN
      INSERT INTO payments (id, member_id, amount, payment_date, due_date, payment_method, status, notes, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        member_id,
        (CASE
          WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'basic' THEN
            COALESCE((SELECT price FROM membership_types WHERE type = 'monthly'), 200)
          WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'premium' THEN
            COALESCE((SELECT price FROM membership_types WHERE type = 'quarterly'), 350)
          WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'platinum' THEN
            COALESCE((SELECT price FROM membership_types WHERE type = 'annual'), 500)
          ELSE
            200 -- Default to 200 if unknown
        END),
        NOW(),
        NOW() + INTERVAL '55 days',
        (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
        'pending'::payment_status,
        'Upcoming membership payment',
        NOW(),
        NOW()
      );
    END IF;

    -- Add an overdue payment for some members
    IF random() < 0.2 THEN
      INSERT INTO payments (id, member_id, amount, payment_date, due_date, payment_method, status, notes, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        member_id,
        (CASE
          WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'basic' THEN
            COALESCE((SELECT price FROM membership_types WHERE type = 'monthly'), 200)
          WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'premium' THEN
            COALESCE((SELECT price FROM membership_types WHERE type = 'quarterly'), 350)
          WHEN (SELECT membership_type FROM members WHERE id = member_id) = 'platinum' THEN
            COALESCE((SELECT price FROM membership_types WHERE type = 'annual'), 500)
          ELSE
            200 -- Default to 200 if unknown
        END),
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '15 days',
        (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
        'overdue'::payment_status,
        'Overdue membership payment',
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '45 days'
      );
    END IF;

    -- Add attendance records for each member
    -- Today's attendance for some members
    IF random() < 0.4 THEN
      INSERT INTO attendance (id, member_id, check_in_time, check_out_time, type, notes, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        member_id,
        NOW() - INTERVAL '3 hours',
        CASE WHEN random() < 0.7 THEN NOW() - INTERVAL '1 hour' ELSE NULL END,
        (ARRAY['gym', 'class', 'personal_training'])[floor(random() * 3 + 1)]::attendance_type,
        CASE WHEN random() < 0.3 THEN 'Regular workout session' ELSE NULL END,
        NOW(),
        NOW()
      );
    END IF;

    -- Yesterday's attendance
    IF random() < 0.4 THEN
      INSERT INTO attendance (id, member_id, check_in_time, check_out_time, type, notes, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        member_id,
        NOW() - INTERVAL '1 day' - INTERVAL '4 hours',
        NOW() - INTERVAL '1 day' - INTERVAL '2 hours',
        (ARRAY['gym', 'class', 'personal_training'])[floor(random() * 3 + 1)]::attendance_type,
        CASE WHEN random() < 0.3 THEN 'Regular workout session' ELSE NULL END,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
      );
    END IF;

    -- Previous week attendance
    IF random() < 0.7 THEN
      INSERT INTO attendance (id, member_id, check_in_time, check_out_time, type, notes, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        member_id,
        NOW() - INTERVAL '7 days' - INTERVAL '5 hours',
        NOW() - INTERVAL '7 days' - INTERVAL '3 hours',
        (ARRAY['gym', 'class', 'personal_training'])[floor(random() * 3 + 1)]::attendance_type,
        CASE WHEN random() < 0.3 THEN 'Regular workout session' ELSE NULL END,
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '7 days'
      );
    END IF;
  END LOOP;

  -- Insert attendance stats for the last 7 days
  FOR i IN 0..6 LOOP
    INSERT INTO attendance_stats (id, date, total_visits, peak_hour, created_at)
    VALUES (
      gen_random_uuid(),
      CURRENT_DATE - i,
      floor(random() * 50) + 10,
      (floor(random() * 12) + 8 || ':00:00')::time,
      NOW()
    );
  END LOOP;

  -- Insert revenue logs for the last 30 days
  FOR i IN 0..29 LOOP
    INSERT INTO revenue_logs (id, date, amount, source, created_at)
    VALUES (
      gen_random_uuid(),
      CURRENT_DATE - i,
      (random() * 1000) + 500,
      (ARRAY['membership', 'personal_training', 'merchandise', 'supplements'])[floor(random() * 4 + 1)]::varchar,
      NOW() - (i || ' days')::interval
    );
  END LOOP;
END $$;

-- Verify data was inserted
SELECT 'Members: ' || COUNT(*) FROM members;
SELECT 'Staff: ' || COUNT(*) FROM staff;
SELECT 'Payments: ' || COUNT(*) FROM payments;
SELECT 'Attendance Records: ' || COUNT(*) FROM attendance;
SELECT 'Attendance Stats: ' || COUNT(*) FROM attendance_stats;
SELECT 'Revenue Logs: ' || COUNT(*) FROM revenue_logs;
