import * as z from "zod";

export const attendanceSchema = z.object({
  memberId: z.string().min(1, "Le membre est requis"),
  checkInTime: z.date(),
  checkOutTime: z.date().optional(),
  type: z.enum(["gym", "class", "personal_training"]),
  notes: z.string().optional(),
  checkInMethod: z.enum(["manual", "qr_code"]).optional().default("manual"),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;