import * as z from "zod";

export const memberSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  membershipType: z.string().min(1, "Membership type is required"),
  startDate: z.date(),
  status: z.enum(["active", "inactive", "suspended"]),
  notes: z.string().nullable().optional(),
});

export type MemberFormValues = z.infer<typeof memberSchema>;