import { z } from 'zod';

export const staffRoles = [
  'admin',
  'manager',
  'trainer',
  'receptionist',
  'maintenance'
] as const;

export const staffSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.enum(staffRoles),
  hireDate: z.date(),
  status: z.enum(['active', 'inactive', 'on_leave']),
  notes: z.string().optional(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;