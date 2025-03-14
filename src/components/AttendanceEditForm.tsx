import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const attendanceEditSchema = z.object({
  checkInTime: z.string(),
  type: z.enum(['gym', 'class', 'personal_training']),
  notes: z.string().optional(),
});

type AttendanceEditFormValues = z.infer<typeof attendanceEditSchema>;

interface AttendanceEditFormProps {
  defaultValues: {
    checkInTime: string;
    type: string;
    notes?: string;
  };
  onSubmit: (data: AttendanceEditFormValues) => void;
}

export function AttendanceEditForm({ defaultValues, onSubmit }: AttendanceEditFormProps) {
  const form = useForm<AttendanceEditFormValues>({
    resolver: zodResolver(attendanceEditSchema),
    defaultValues: {
      checkInTime: format(new Date(defaultValues.checkInTime), "yyyy-MM-dd'T'HH:mm"),
      type: defaultValues.type,
      notes: defaultValues.notes || ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="checkInTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heure d'arrivée</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <select
                {...field}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="gym">Salle de Sport</option>
                <option value="class">Cours</option>
                <option value="personal_training">Entraînement Personnel</option>
              </select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Mettre à jour
        </Button>
      </form>
    </Form>
  );
} 