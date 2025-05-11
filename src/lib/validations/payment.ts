import * as z from "zod";

export const paymentSchema = z.object({
  memberId: z.string().min(1, "Le membre est requis"),
  membershipType: z.string().optional().nullable(),
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  paymentDate: z.date(),
  dueDate: z.date(),
  status: z.enum(["paid", "pending", "overdue", "cancelled"] as const),
  paymentMethod: z.enum(["cash", "credit_card", "debit_card", "bank_transfer", "other"] as const),
  notes: z.string().nullable().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;