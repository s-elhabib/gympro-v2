-- Reset Database Script
-- This script will delete all existing data and populate the database with 75 sample members

-- First, delete all existing data
DELETE FROM revenue_logs;
DELETE FROM attendance_stats;
DELETE FROM attendance;
DELETE FROM payments;
DELETE FROM staff;
DELETE FROM members;

-- Make sure membership types exist by deleting and recreating them
DELETE FROM membership_types WHERE type IN ('monthly', 'quarterly', 'annual', 'day_pass');

INSERT INTO membership_types (type, price, duration) VALUES
('monthly', 200, 30),
('quarterly', 350, 90),
('annual', 500, 365),
('day_pass', 50, 1);

-- Function to generate random phone numbers
CREATE OR REPLACE FUNCTION generate_phone()
RETURNS text AS $$
BEGIN
  RETURN '06' || floor(random() * 90000000 + 10000000)::text;
END;
$$ LANGUAGE plpgsql;

-- Function to generate random dates within a range
CREATE OR REPLACE FUNCTION random_date(start_date date, end_date date)
RETURNS date AS $$
BEGIN
  RETURN start_date + floor(random() * (end_date - start_date + 1))::integer;
END;
$$ LANGUAGE plpgsql;

-- Insert demo data
DO $$
DECLARE
  first_names text[] := ARRAY[
    'Mohammed', 'Fatima', 'Youssef', 'Amina', 'Karim', 'Layla', 'Omar', 'Nadia',
    'Hassan', 'Samira', 'Ali', 'Leila', 'Ibrahim', 'Yasmine', 'Ahmed', 'Sofia',
    'Mehdi', 'Rania', 'Hamza', 'Malak', 'Ziad', 'Nour', 'Bilal', 'Sara',
    'Rachid', 'Aisha', 'Tarik', 'Rim', 'Jamal', 'Salma', 'Adam', 'Ghita',
    'Amine', 'Houda', 'Samir', 'Imane', 'Khalil', 'Zineb', 'Reda', 'Asma'
  ];
  last_names text[] := ARRAY[
    'Alami', 'Benali', 'Mansouri', 'Tazi', 'Idrissi', 'Bouazizi', 'Benjelloun',
    'El Fassi', 'Chraibi', 'Ziani', 'El Amrani', 'Berrada', 'Tahiri', 'Lahlou',
    'Bennani', 'Alaoui', 'Haddad', 'Belhaj', 'Moussaoui', 'Ouazzani',
    'Laraki', 'Sebti', 'Filali', 'Chaoui', 'Bennasser', 'Drissi', 'Saidi',
    'Hassani', 'Belghiti', 'Kadiri', 'Lazrak', 'Mernissi', 'Skalli', 'Raji',
    'Kettani', 'Cherkaoui', 'Bennis', 'Lamrani', 'Fassi', 'Belkadi'
  ];
  member_types membership_type[] := ARRAY['basic', 'premium', 'platinum'];
  member_statuses member_status[] := ARRAY['active', 'inactive', 'suspended'];
  notes_templates text[] := ARRAY[
    'Regular gym-goer, interested in personal training',
    'Prefers morning classes',
    'Training for marathon',
    'Interested in yoga classes',
    'Focuses on weight training',
    'Interested in nutrition advice',
    'Professional athlete',
    'New member, first-time gym user',
    'Recovering from injury, needs special attention',
    'Preparing for competition'
  ];
  i integer;
  member_id uuid;
  random_first_name text;
  random_last_name text;
  email text;
  birth_date date;
  start_date date;
  membership membership_type;
  status member_status;
  attendance_date timestamp;
  payment_amount numeric;
  payment_date timestamp;
  due_date timestamp;
  attendance_type attendance_type;
  current_ts timestamp := NOW();
BEGIN
  -- Insert staff
  INSERT INTO staff (id, first_name, last_name, email, phone, role, hire_date, status, notes, created_at, updated_at) VALUES
    (gen_random_uuid(), 'Ahmed', 'Berrada', 'ahmed.berrada2@gym.com', generate_phone(), 'admin', '2022-01-15', 'active', 'Gym manager', current_ts, current_ts),
    (gen_random_uuid(), 'Salma', 'Kabbaj', 'salma.kabbaj2@gym.com', generate_phone(), 'trainer', '2022-03-10', 'active', 'Yoga and fitness instructor', current_ts, current_ts),
    (gen_random_uuid(), 'Rachid', 'Moussaoui', 'rachid.m2@gym.com', generate_phone(), 'trainer', '2022-05-20', 'active', 'Strength training specialist', current_ts, current_ts),
    (gen_random_uuid(), 'Leila', 'Haddad', 'leila.h2@gym.com', generate_phone(), 'receptionist', '2022-08-05', 'active', 'Front desk, morning shift', current_ts, current_ts),
    (gen_random_uuid(), 'Hamid', 'Ouazzani', 'hamid.o2@gym.com', generate_phone(), 'maintenance', '2022-10-12', 'active', 'Equipment maintenance', current_ts, current_ts),
    (gen_random_uuid(), 'Kamal', 'Bennani', 'kamal.b2@gym.com', generate_phone(), 'trainer', '2023-01-20', 'active', 'CrossFit specialist', current_ts, current_ts),
    (gen_random_uuid(), 'Nora', 'Alaoui', 'nora.a2@gym.com', generate_phone(), 'trainer', '2023-03-15', 'active', 'Pilates instructor', current_ts, current_ts),
    (gen_random_uuid(), 'Yassine', 'Chraibi', 'yassine.c2@gym.com', generate_phone(), 'receptionist', '2023-06-01', 'active', 'Front desk, evening shift', current_ts, current_ts);

  -- Insert members
  FOR i IN 1..75 LOOP
    random_first_name := first_names[1 + floor(random() * array_length(first_names, 1))];
    random_last_name := last_names[1 + floor(random() * array_length(last_names, 1))];
    email := lower(random_first_name || '.' || random_last_name || i || '@example.com');
    birth_date := random_date('1970-01-01'::date, '2005-12-31'::date);
    start_date := random_date('2023-01-01'::date, current_ts::date);
    membership := member_types[1 + floor(random() * 3)];
    status := CASE WHEN random() < 0.8 THEN 'active' ELSE member_statuses[1 + floor(random() * 3)] END;

    INSERT INTO members (id, first_name, last_name, email, phone, gender, birth_date, membership_type, start_date, status, notes, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      random_first_name,
      random_last_name,
      email,
      generate_phone(),
      CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
      birth_date,
      membership,
      start_date,
      status,
      notes_templates[1 + floor(random() * array_length(notes_templates, 1))],
      current_ts,
      current_ts
    ) RETURNING id INTO member_id;

    -- Payments
    payment_amount := CASE
      WHEN membership = 'basic' THEN 200
      WHEN membership = 'premium' THEN 350
      ELSE 500
    END;

    FOR payment_date IN 
      SELECT generate_series(
        start_date::timestamp,
        current_ts,
        CASE 
          WHEN membership = 'basic' THEN interval '1 month'
          WHEN membership = 'premium' THEN interval '3 months'
          ELSE interval '1 year'
        END
      )
    LOOP
      due_date := payment_date + CASE 
        WHEN membership = 'basic' THEN interval '1 month'
        WHEN membership = 'premium' THEN interval '3 months'
        ELSE interval '1 year'
      END;

      IF due_date > current_ts OR payment_date <= current_ts THEN
        INSERT INTO payments (id, member_id, amount, payment_date, due_date, payment_method, status, notes, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          member_id,
          payment_amount,
          payment_date,
          due_date,
          (ARRAY['cash', 'credit_card', 'bank_transfer'])[floor(random() * 3 + 1)::int]::payment_method,
          CASE
            WHEN payment_date > current_ts THEN 'pending'
            WHEN random() < 0.9 THEN 'paid'
            ELSE 'overdue'
          END::payment_status,
          'Regular membership payment',
          payment_date,
          payment_date
        );
      END IF;
    END LOOP;

    -- Attendance
    IF status = 'active' THEN
      FOR attendance_date IN 
        SELECT generate_series(
          GREATEST(start_date::timestamp, current_ts - interval '3 months'),
          current_ts,
          '2 days'::interval
        )
      LOOP
        IF random() < 0.7 THEN
          attendance_type := (ARRAY['gym', 'class', 'personal_training'])[floor(random() * 3 + 1)]::attendance_type;

          INSERT INTO attendance (id, member_id, check_in_time, check_out_time, type, notes, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            member_id,
            attendance_date + (floor(random() * 12 + 7) || ' hours')::interval,
            attendance_date + (floor(random() * 12 + 7) || ' hours')::interval + (floor(random() * 3 + 1) || ' hours')::interval,
            attendance_type,
            CASE WHEN random() < 0.3 THEN 'Regular workout session' ELSE NULL END,
            attendance_date,
            attendance_date
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Attendance stats
  FOR i IN 0..29 LOOP
    INSERT INTO attendance_stats (id, date, total_visits, peak_hour, created_at)
    VALUES (
      gen_random_uuid(),
      CURRENT_DATE - i,
      floor(random() * 100) + 20,
      (floor(random() * 12) + 8 || ':00:00')::time,
      current_ts
    )
    ON CONFLICT (date) DO NOTHING;
  END LOOP;

  -- Revenue logs
  FOR i IN 0..29 LOOP
    INSERT INTO revenue_logs (id, date, amount, source, created_at)
    VALUES (
      gen_random_uuid(),
      CURRENT_DATE - i,
      (random() * 2000) + 500,
      (ARRAY['membership', 'personal_training', 'merchandise', 'supplements'])[floor(random() * 4 + 1)],
      current_ts - (i || ' days')::interval
    );
  END LOOP;

  -- Cleanup
  DROP FUNCTION IF EXISTS generate_phone();
  DROP FUNCTION IF EXISTS random_date(date, date);
END $$;

-- Summary
SELECT 'Members: ' || COUNT(*) FROM members;
SELECT 'Staff: ' || COUNT(*) FROM staff;
SELECT 'Payments: ' || COUNT(*) FROM payments;
SELECT 'Attendance Records: ' || COUNT(*) FROM attendance;
SELECT 'Attendance Stats: ' || COUNT(*) FROM attendance_stats;
SELECT 'Revenue Logs: ' || COUNT(*) FROM revenue_logs;
