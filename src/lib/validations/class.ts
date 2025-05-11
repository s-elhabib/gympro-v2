import { z } from 'zod';

export const classSchema = z.object({
  name: z.string().min(2, 'Le nom du cours doit contenir au moins 2 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  instructor: z.string().min(1, 'L\'instructeur est requis'),
  capacity: z.number().min(1, 'La capacité doit être d\'au moins 1'),
  duration: z.number().min(15, 'La durée doit être d\'au moins 15 minutes'),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().min(1, 'Le lieu est requis'),
  category: z.enum(['strength', 'cardio', 'flexibility', 'mind_body', 'dance', 'specialty']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']),
  isActive: z.boolean().default(true),
});

export type ClassFormValues = z.infer<typeof classSchema>;

export const classDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export const classCategories = [
  { value: 'strength', label: 'Strength Training' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility & Mobility' },
  { value: 'mind_body', label: 'Mind & Body' },
  { value: 'dance', label: 'Dance' },
  { value: 'specialty', label: 'Specialty' },
];

export const classDifficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all_levels', label: 'All Levels' },
];