-- =============================================
-- POPULATE TEST DATA SCRIPT
-- =============================================
-- This script adds 5 test members and related data to the database
-- It's designed to provide a comprehensive test dataset

-- First, clear all existing data
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

-- =============================================
-- ADD TEST MEMBERS
-- =============================================
INSERT INTO members (id, first_name, last_name, email, phone, gender, birth_date, membership_type, start_date, status, notes, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Mohammed', 'Alami', 'mohammed.alami@example.com', '0612345678', 'male', '1990-05-15', 'premium'::membership_type, '2023-10-01', 'active'::member_status, 'Regular gym-goer, interested in personal training', NOW(), NOW()),
  (gen_random_uuid(), 'Fatima', 'Benali', 'fatima.benali@example.com', '0623456789', 'female', '1988-08-22', 'basic'::membership_type, '2023-11-15', 'active'::member_status, 'Prefers morning classes', NOW(), NOW()),
  (gen_random_uuid(), 'Youssef', 'Mansouri', 'youssef.m@example.com', '0634567890', 'male', '1995-03-10', 'platinum'::membership_type, '2023-09-05', 'active'::member_status, 'Training for marathon', NOW(), NOW()),
  (gen_random_uuid(), 'Amina', 'Tazi', 'amina.tazi@example.com', '0645678901', 'female', '1992-12-03', 'premium'::membership_type, '2024-01-10', 'active'::member_status, 'Interested in yoga classes', NOW(), NOW()),
  (gen_random_uuid(), 'Karim', 'Idrissi', 'karim.idrissi@example.com', '0656789012', 'male', '1985-07-28', 'basic'::membership_type, '2023-08-20', 'inactive'::member_status, 'Temporarily suspended due to travel', NOW(), NOW());

-- =============================================
-- ADD STAFF MEMBERS
-- =============================================
INSERT INTO staff (id, first_name, last_name, email, phone, role, hire_date, status, notes, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Ahmed', 'Berrada', 'ahmed.berrada@gym.com', '0712345678', 'admin'::staff_role, '2022-01-15', 'active'::staff_status, 'Gym manager', NOW(), NOW()),
  (gen_random_uuid(), 'Salma', 'Kabbaj', 'salma.kabbaj@gym.com', '0723456789', 'trainer'::staff_role, '2022-03-10', 'active'::staff_status, 'Yoga and fitness instructor', NOW(), NOW()),
  (gen_random_uuid(), 'Rachid', 'Moussaoui', 'rachid.m@gym.com', '0734567890', 'trainer'::staff_role, '2022-05-20', 'active'::staff_status, 'Strength training specialist', NOW(), NOW());

-- =============================================
-- ADD CLASSES
-- =============================================
INSERT INTO classes (id, name, description, instructor, capacity, duration, day, start_time, end_time, location, category, difficulty, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Power Yoga', 'Une approche vigoureuse du yoga de style vinyasa basee sur le fitness.', 'Salma Kabbaj', 25, 60, 'monday'::day_of_week, '07:00', '08:00', 'Studio A', 'mind_body'::class_category, 'intermediate'::class_difficulty, true, NOW(), NOW()),
  (gen_random_uuid(), 'Cours de Velo', 'Entrainement intense de cyclisme en salle sur une musique energisante.', 'Rachid Moussaoui', 20, 45, 'tuesday'::day_of_week, '17:30', '18:15', 'Salle de Velo', 'cardio'::class_category, 'all_levels'::class_difficulty, true, NOW(), NOW()),
  (gen_random_uuid(), 'Entrainement HIIT', 'Entrainement par intervalles de haute intensite pour bruler des calories et ameliorer la condition physique.', 'Rachid Moussaoui', 15, 30, 'wednesday'::day_of_week, '18:30', '19:00', 'Zone Fonctionnelle', 'cardio'::class_category, 'advanced'::class_difficulty, true, NOW(), NOW()),
  (gen_random_uuid(), 'Pilates Base', 'Cours de Pilates axe sur le renforcement du noyau et l''amelioration de la posture.', 'Salma Kabbaj', 20, 45, 'thursday'::day_of_week, '09:00', '09:45', 'Studio B', 'mind_body'::class_category, 'beginner'::class_difficulty, true, NOW(), NOW()),
  (gen_random_uuid(), 'Zumba', 'Cours de danse energique et amusant inspire par la musique latine.', 'Salma Kabbaj', 30, 60, 'friday'::day_of_week, '19:00', '20:00', 'Studio A', 'dance'::class_category, 'all_levels'::class_difficulty, true, NOW(), NOW());

-- =============================================
-- POPULATE DATA FOR MEMBERS
-- =============================================
DO $$
DECLARE
  member_ids UUID[] := ARRAY(SELECT id FROM members ORDER BY created_at);
  class_ids UUID[] := ARRAY(SELECT id FROM classes ORDER BY created_at);
  current_member_id UUID;
  current_class_id UUID;
  payment_amount DECIMAL(10,2);
  today DATE := CURRENT_DATE;
  i INTEGER;
BEGIN
  -- Enroll members in classes
  FOREACH current_member_id IN ARRAY member_ids
  LOOP
    -- Enroll each member in 1-3 random classes
    FOR i IN 1..floor(random() * 3 + 1)::int
    LOOP
      current_class_id := class_ids[floor(random() * array_length(class_ids, 1) + 1)];

      -- Only insert if this enrollment doesn't exist yet
      IF NOT EXISTS (
        SELECT 1 FROM class_enrollments
        WHERE member_id = current_member_id AND class_id = current_class_id
      ) THEN
        INSERT INTO class_enrollments (
          id, class_id, member_id, enrollment_date, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), current_class_id, current_member_id,
          NOW() - (floor(random() * 30)::int || ' days')::interval,
          'active', NOW(), NOW()
        );
      END IF;
    END LOOP;

    -- Set payment amount based on membership type
    SELECT
      CASE
        WHEN membership_type = 'basic' THEN 200.00
        WHEN membership_type = 'premium' THEN 350.00
        ELSE 500.00
      END INTO payment_amount
    FROM members
    WHERE id = current_member_id;

    -- Current month payment (paid for most members)
    IF random() < 0.8 THEN
      INSERT INTO payments (
        id, member_id, amount, payment_date, due_date,
        payment_method, status, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), current_member_id, payment_amount,
        today - INTERVAL '5 days', today + INTERVAL '25 days',
        (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
        'paid'::payment_status, 'Monthly membership payment', NOW(), NOW()
      );
    ELSE
      -- Pending payment for some members
      INSERT INTO payments (
        id, member_id, amount, payment_date, due_date,
        payment_method, status, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), current_member_id, payment_amount,
        today, today + INTERVAL '25 days',
        (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
        'pending'::payment_status, 'Monthly membership payment', NOW(), NOW()
      );
    END IF;

    -- Previous month payment (all paid)
    INSERT INTO payments (
      id, member_id, amount, payment_date, due_date,
      payment_method, status, notes, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), current_member_id, payment_amount,
      today - INTERVAL '35 days', today - INTERVAL '5 days',
      (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
      'paid'::payment_status, 'Monthly membership payment',
      today - INTERVAL '35 days', today - INTERVAL '35 days'
    );

    -- Add an overdue payment for some members
    IF random() < 0.4 THEN
      INSERT INTO payments (
        id, member_id, amount, payment_date, due_date,
        payment_method, status, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), current_member_id, payment_amount,
        today - INTERVAL '45 days', today - INTERVAL '15 days',
        (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)]::payment_method,
        'overdue'::payment_status, 'Overdue membership payment',
        today - INTERVAL '45 days', today - INTERVAL '45 days'
      );
    END IF;

    -- Add attendance records for each member
    -- Today's attendance for some members
    IF random() < 0.4 THEN
      INSERT INTO attendance (
        id, member_id, check_in_time, check_out_time, type, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), current_member_id,
        NOW() - INTERVAL '3 hours',
        CASE WHEN random() < 0.7 THEN NOW() - INTERVAL '1 hour' ELSE NULL END,
        (ARRAY['gym', 'class', 'personal_training'])[floor(random() * 3 + 1)]::attendance_type,
        CASE WHEN random() < 0.3 THEN 'Regular workout session' ELSE NULL END,
        NOW(), NOW()
      );
    END IF;

    -- Yesterday's attendance
    IF random() < 0.4 THEN
      INSERT INTO attendance (
        id, member_id, check_in_time, check_out_time, type, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), current_member_id,
        NOW() - INTERVAL '1 day' - INTERVAL '4 hours',
        NOW() - INTERVAL '1 day' - INTERVAL '2 hours',
        (ARRAY['gym', 'class', 'personal_training'])[floor(random() * 3 + 1)]::attendance_type,
        CASE WHEN random() < 0.3 THEN 'Regular workout session' ELSE NULL END,
        NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
      );
    END IF;

    -- Previous week attendance
    FOR i IN 1..floor(random() * 3 + 1)::int
    LOOP
      INSERT INTO attendance (
        id, member_id, check_in_time, check_out_time, type, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), current_member_id,
        NOW() - INTERVAL '7 days' - (i || ' days')::interval - INTERVAL '5 hours',
        NOW() - INTERVAL '7 days' - (i || ' days')::interval - INTERVAL '3 hours',
        (ARRAY['gym', 'class', 'personal_training'])[floor(random() * 3 + 1)]::attendance_type,
        CASE WHEN random() < 0.3 THEN 'Regular workout session' ELSE NULL END,
        NOW() - INTERVAL '7 days' - (i || ' days')::interval,
        NOW() - INTERVAL '7 days' - (i || ' days')::interval
      );
    END LOOP;
  END LOOP;

  -- Insert attendance stats for the last 7 days
  FOR i IN 0..6 LOOP
    INSERT INTO attendance_stats (id, date, total_visits, peak_hour, created_at)
    VALUES (
      gen_random_uuid(),
      CURRENT_DATE - i,
      floor(random() * 30) + 5,
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
      (random() * 500) + 200,
      (ARRAY['membership', 'personal_training', 'merchandise', 'supplements'])[floor(random() * 4 + 1)]::varchar,
      NOW() - (i || ' days')::interval
    );
  END LOOP;
END $$;

-- =============================================
-- VERIFY DATA WAS INSERTED
-- =============================================
SELECT 'Members: ' || COUNT(*) FROM members;
SELECT 'Staff: ' || COUNT(*) FROM staff;
SELECT 'Classes: ' || COUNT(*) FROM classes;
SELECT 'Class Enrollments: ' || COUNT(*) FROM class_enrollments;
SELECT 'Payments: ' || COUNT(*) FROM payments;
SELECT 'Attendance Records: ' || COUNT(*) FROM attendance;
SELECT 'Attendance Stats: ' || COUNT(*) FROM attendance_stats;
SELECT 'Revenue Logs: ' || COUNT(*) FROM revenue_logs;

-- Output success message
SELECT 'Test data populated successfully!' AS result;
