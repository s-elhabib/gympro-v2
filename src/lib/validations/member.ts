import * as z from "zod";

export const memberSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 caractères"),
  membershipType: z.string().min(1, "Le type d'abonnement est requis"),
  startDate: z.date(),
  status: z.enum(["active", "inactive", "suspended"]),
  notes: z.string().nullable().optional(),
});

export type MemberFormValues = z.infer<typeof memberSchema>;