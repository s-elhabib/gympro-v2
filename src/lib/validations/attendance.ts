import * as z from "zod";

export const attendanceSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  checkInTime: z.date(),
  checkOutTime: z.date().optional(),
  type: z.enum(["gym", "class", "personal_training"]),
  notes: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;