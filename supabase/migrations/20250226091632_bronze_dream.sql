/*
  # Add mock data for testing

  This migration adds sample data for:
  1. Members
  2. Payments
  3. Attendance records

  Note: All data is for demonstration purposes only
*/

-- Insert mock members
INSERT INTO members (id, first_name, last_name, email, phone, membership_type, start_date, status) VALUES
  ('d7fd2e70-1234-4567-8901-abcdef123456', 'John', 'Doe', 'john.doe@example.com', '123-456-7890', 'premium', '2024-01-01', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123457', 'Jane', 'Smith', 'jane.smith@example.com', '123-456-7891', 'platinum', '2024-01-15', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123458', 'Michael', 'Johnson', 'michael.j@example.com', '123-456-7892', 'basic', '2024-02-01', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123459', 'Sarah', 'Williams', 'sarah.w@example.com', '123-456-7893', 'premium', '2024-02-15', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', 'Robert', 'Brown', 'robert.b@example.com', '123-456-7894', 'platinum', '2024-03-01', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123461', 'Emily', 'Davis', 'emily.d@example.com', '123-456-7895', 'basic', '2024-03-15', 'inactive'),
  ('d7fd2e70-1234-4567-8901-abcdef123462', 'David', 'Miller', 'david.m@example.com', '123-456-7896', 'premium', '2024-01-20', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123463', 'Lisa', 'Wilson', 'lisa.w@example.com', '123-456-7897', 'basic', '2024-02-10', 'suspended'),
  ('d7fd2e70-1234-4567-8901-abcdef123464', 'James', 'Taylor', 'james.t@example.com', '123-456-7898', 'platinum', '2024-03-05', 'active'),
  ('d7fd2e70-1234-4567-8901-abcdef123465', 'Emma', 'Anderson', 'emma.a@example.com', '123-456-7899', 'premium', '2024-01-10', 'active');

-- Insert mock payments
INSERT INTO payments (member_id, amount, payment_date, due_date, status, payment_method, notes) VALUES
  ('d7fd2e70-1234-4567-8901-abcdef123456', 99.99, '2024-01-01', '2024-02-01', 'paid', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123457', 149.99, '2024-01-15', '2024-02-15', 'paid', 'bank_transfer', 'Monthly platinum membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123458', 49.99, '2024-02-01', '2024-03-01', 'pending', 'cash', 'Monthly basic membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123459', 99.99, '2024-02-15', '2024-03-15', 'overdue', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', 149.99, '2024-03-01', '2024-04-01', 'pending', 'debit_card', 'Monthly platinum membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123461', 49.99, '2024-03-15', '2024-04-15', 'cancelled', 'bank_transfer', 'Monthly basic membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123462', 99.99, '2024-01-20', '2024-02-20', 'paid', 'credit_card', 'Monthly premium membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123463', 49.99, '2024-02-10', '2024-03-10', 'overdue', 'cash', 'Monthly basic membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123464', 149.99, '2024-03-05', '2024-04-05', 'pending', 'bank_transfer', 'Monthly platinum membership'),
  ('d7fd2e70-1234-4567-8901-abcdef123465', 99.99, '2024-01-10', '2024-02-10', 'paid', 'debit_card', 'Monthly premium membership');

-- Insert mock attendance records
INSERT INTO attendance (member_id, check_in_time, check_out_time, type, notes) VALUES
  ('d7fd2e70-1234-4567-8901-abcdef123456', '2024-03-26 08:00:00', '2024-03-26 09:30:00', 'gym', 'Regular workout'),
  ('d7fd2e70-1234-4567-8901-abcdef123457', '2024-03-26 09:00:00', '2024-03-26 10:45:00', 'class', 'Yoga class'),
  ('d7fd2e70-1234-4567-8901-abcdef123458', '2024-03-26 10:00:00', '2024-03-26 11:15:00', 'personal_training', 'PT session'),
  ('d7fd2e70-1234-4567-8901-abcdef123459', '2024-03-26 11:00:00', NULL, 'gym', 'Currently working out'),
  ('d7fd2e70-1234-4567-8901-abcdef123460', '2024-03-26 12:00:00', '2024-03-26 13:30:00', 'class', 'Spinning class');