import { z } from 'zod';

export const staffRoles = [
  'admin',
  'manager',
  'trainer',
  'receptionist',
  'maintenance'
] as const;

export const staffSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().min(10, 'Le numéro de téléphone doit contenir au moins 10 chiffres'),
  role: z.enum(staffRoles),
  hireDate: z.date(),
  status: z.enum(['active', 'inactive', 'on_leave']),
  notes: z.string().optional(),
});

export type StaffFormValues = z.infer<typeof staffSchema>;