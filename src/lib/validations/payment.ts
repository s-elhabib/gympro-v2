import * as z from "zod";

export const paymentSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.date(),
  dueDate: z.date(),
  status: z.enum(["paid", "pending", "overdue", "cancelled"]),
  paymentMethod: z.enum(["cash", "credit_card", "debit_card", "bank_transfer", "other"]),
  notes: z.string().nullable().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;