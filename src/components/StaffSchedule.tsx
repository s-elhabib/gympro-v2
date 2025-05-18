import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';

const daysOfWeek = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' },
];

const scheduleSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
  location: z.string().min(1, 'L\'emplacement est requis'),
  notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface StaffScheduleProps {
  staffId: string;
}

const StaffSchedule: React.FC<StaffScheduleProps> = ({ staffId }) => {
  const { addNotification } = useNotifications();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<any>(null);

  useEffect(() => {
    fetchSchedules();
  }, [staffId]);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .order('day', { ascending: true });

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les horaires',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchedule = async (data: ScheduleFormValues) => {
    try {
      const { error } = await supabase
        .from('staff_schedules')
        .insert([{
          staff_id: staffId,
          day: data.day,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          notes: data.notes || ''
        }]);

      if (error) throw error;

      setIsAddDialogOpen(false);
      fetchSchedules();

      addNotification({
        title: 'Succès',
        message: 'Horaire ajouté avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de l\'ajout de l\'horaire',
        type: 'error'
      });
    }
  };

  const handleEditSchedule = async (data: ScheduleFormValues) => {
    try {
      if (!currentSchedule) return;

      const { error } = await supabase
        .from('staff_schedules')
        .update({
          day: data.day,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          notes: data.notes || ''
        })
        .eq('id', currentSchedule.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setCurrentSchedule(null);
      fetchSchedules();

      addNotification({
        title: 'Succès',
        message: 'Horaire mis à jour avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la mise à jour de l\'horaire',
        type: 'error'
      });
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      if (!currentSchedule) return;

      const { error } = await supabase
        .from('staff_schedules')
        .delete()
        .eq('id', currentSchedule.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setCurrentSchedule(null);
      fetchSchedules();

      addNotification({
        title: 'Succès',
        message: 'Horaire supprimé avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la suppression de l\'horaire',
        type: 'error'
      });
    }
  };

  const ScheduleForm = ({ defaultValues, onSubmit }: { defaultValues?: Partial<ScheduleFormValues>, onSubmit: (data: ScheduleFormValues) => void }) => {
    const form = useForm<ScheduleFormValues>({
      resolver: zodResolver(scheduleSchema),
      defaultValues: {
        day: 'monday',
        start_time: '09:00',
        end_time: '17:00',
        location: '',
        notes: '',
        ...defaultValues,
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jour</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de début</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de fin</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emplacement</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Salle principale, Studio yoga, etc." />
                </FormControl>
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
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Informations supplémentaires..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Form>
    );
  };

  const getDayLabel = (day: string) => {
    const found = daysOfWeek.find(d => d.value === day);
    return found ? found.label : day;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Horaires Hebdomadaires</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un Horaire
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Aucun horaire défini</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            Ajouter un Horaire
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50">
              <div>
                <div className="font-medium">{getDayLabel(schedule.day)}</div>
                <div className="text-sm text-gray-500">
                  {schedule.start_time} - {schedule.end_time} • {schedule.location}
                </div>
                {schedule.notes && (
                  <div className="text-sm text-gray-500 mt-1">{schedule.notes}</div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCurrentSchedule(schedule);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCurrentSchedule(schedule);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Schedule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Horaire</DialogTitle>
            <DialogDescription>
              Définir un nouvel horaire de travail pour ce membre du personnel.
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm onSubmit={handleAddSchedule} />
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'Horaire</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations de l'horaire.
            </DialogDescription>
          </DialogHeader>
          {currentSchedule && (
            <ScheduleForm
              defaultValues={{
                day: currentSchedule.day,
                start_time: currentSchedule.start_time,
                end_time: currentSchedule.end_time,
                location: currentSchedule.location,
                notes: currentSchedule.notes
              }}
              onSubmit={handleEditSchedule}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Schedule Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'Horaire</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet horaire ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchedule}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffSchedule;