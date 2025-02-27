-- Insert mock members
INSERT INTO members (id, first_name, last_name, email, phone, membership_type, start_date, status) VALUES
  ('d7fd2e70-1234-4567-8901-abcdef123456', 'John', 'Doe', 'john.doe@example.com', '123-456-7890', 'premium', '2024-01-01', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123457', 'Jane', 'Smith', 'jane.smith@example.com', '123-456-7891', 'platinum', '2024-01-15', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123458', 'Michael', 'Johnson', 'michael.j@example.com', '123-456-7892', 'basic', '2024-02-01', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123459', 'Sarah', 'Williams', 'sarah.w@example.com', '123-456-7893', 'premium', '2024-02-15', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', 'Robert', 'Brown', 'robert.b@example.com', '123-456-7894', 'platinum', '2024-03-01', 'active');

-- Insert mock payments with varied dates and amounts
INSERT INTO payments (member_id, amount, payment_date, due_date, status, payment_method, notes) VALUES
  -- Last 24 hours
  ('d7fd2e70-1234-4567-8901-abcdef123456', 99.99, NOW() - INTERVAL '12 hours', NOW() + INTERVAL '15 days', 'paid', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123457', 149.99, NOW() - INTERVAL '18 hours', NOW() + INTERVAL '15 days', 'paid', 'bank_transfer', 'Monthly platinum membership'),

  -- Last 7 days
  ('d7fd2e70-1234-4567-8901-abcdef123458', 49.99, NOW() - INTERVAL '3 days', NOW() + INTERVAL '12 days', 'paid', 'cash', 'Monthly basic membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123459', 99.99, NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', 'paid', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', 149.99, NOW() - INTERVAL '6 days', NOW() + INTERVAL '9 days', 'paid', 'debit_card', 'Monthly platinum membership'),

  -- Last 30 days
  ('d7fd2e70-1234-4567-8901-abcdef123456', 99.99, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day', 'paid', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123457', 149.99, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days', 'paid', 'bank_transfer', 'Monthly platinum membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123458', 49.99, NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days', 'paid', 'cash', 'Monthly basic membership'),

  -- Last 90 days
  ('d7fd2e70-1234-4567-8901-abcdef123459', 99.99, NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days', 'paid', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', 149.99, NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days', 'paid', 'debit_card', 'Monthly platinum membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123456', 99.99, NOW() - INTERVAL '75 days', NOW() - INTERVAL '60 days', 'paid', 'credit_card', 'Monthly premium membership'),

  -- Last 12 months (older payments)
  ('d7fd2e70-1234-4567-8901-abcdef123457', 149.99, NOW() - INTERVAL '4 months', NOW() - INTERVAL '3 months', 'paid', 'bank_transfer', 'Monthly platinum membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123458', 49.99, NOW() - INTERVAL '6 months', NOW() - INTERVAL '5 months', 'paid', 'cash', 'Monthly basic membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123459', 99.99, NOW() - INTERVAL '8 months', NOW() - INTERVAL '7 months', 'paid', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', 149.99, NOW() - INTERVAL '10 months', NOW() - INTERVAL '9 months', 'paid', 'debit_card', 'Monthly platinum membership');

-- Insert mock attendance records
INSERT INTO attendance (member_id, check_in_time, check_out_time, type, notes) VALUES
  ('d7fd2e70-1234-4567-8901-abcdef123456', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'gym', 'Regular workout'),
  ('d7fd2e70-1234-4567-8901-abcdef123457', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 'class', 'Yoga class'),
  ('d7fd2e70-1234-4567-8901-abcdef123458', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 'personal_training', 'PT session'),
  ('d7fd2e70-1234-4567-8901-abcdef123459', NOW() - INTERVAL '1 hour', NULL, 'gym', 'Currently working out'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', 'class', 'Spinning class');