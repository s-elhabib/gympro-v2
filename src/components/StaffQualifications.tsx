import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Award, Calendar } from 'lucide-react';
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
import { format } from 'date-fns';

const qualificationTypes = [
  { value: 'certification', label: 'Certification' },
  { value: 'diploma', label: 'Diplôme' },
  { value: 'license', label: 'Licence' },
  { value: 'training', label: 'Formation' },
  { value: 'other', label: 'Autre' },
];

const qualificationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  issuer: z.string().min(2, 'L\'émetteur doit contenir au moins 2 caractères'),
  issue_date: z.date(),
  expiry_date: z.date().optional().nullable(),
  type: z.enum(['certification', 'diploma', 'license', 'training', 'other']),
  description: z.string().optional(),
});

type QualificationFormValues = z.infer<typeof qualificationSchema>;

interface StaffQualificationsProps {
  staffId: string;
}

const StaffQualifications: React.FC<StaffQualificationsProps> = ({ staffId }) => {
  const { addNotification } = useNotifications();
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentQualification, setCurrentQualification] = useState<any>(null);

  useEffect(() => {
    fetchQualifications();
  }, [staffId]);

  const fetchQualifications = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('staff_qualifications')
        .select('*')
        .eq('staff_id', staffId)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      setQualifications(data || []);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les qualifications',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQualification = async (data: QualificationFormValues) => {
    try {
      const { error } = await supabase
        .from('staff_qualifications')
        .insert([{
          staff_id: staffId,
          name: data.name,
          issuer: data.issuer,
          issue_date: data.issue_date.toISOString().split('T')[0],
          expiry_date: data.expiry_date ? data.expiry_date.toISOString().split('T')[0] : null,
          type: data.type,
          description: data.description || ''
        }]);

      if (error) throw error;

      setIsAddDialogOpen(false);
      fetchQualifications();

      addNotification({
        title: 'Succès',
        message: 'Qualification ajoutée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding qualification:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de l\'ajout de la qualification',
        type: 'error'
      });
    }
  };

  const handleEditQualification = async (data: QualificationFormValues) => {
    try {
      if (!currentQualification) return;

      const { error } = await supabase
        .from('staff_qualifications')
        .update({
          name: data.name,
          issuer: data.issuer,
          issue_date: data.issue_date.toISOString().split('T')[0],
          expiry_date: data.expiry_date ? data.expiry_date.toISOString().split('T')[0] : null,
          type: data.type,
          description: data.description || ''
        })
        .eq('id', currentQualification.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setCurrentQualification(null);
      fetchQualifications();

      addNotification({
        title: 'Succès',
        message: 'Qualification mise à jour avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating qualification:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la mise à jour de la qualification',
        type: 'error'
      });
    }
  };

  const handleDeleteQualification = async () => {
    try {
      if (!currentQualification) return;

      const { error } = await supabase
        .from('staff_qualifications')
        .delete()
        .eq('id', currentQualification.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setCurrentQualification(null);
      fetchQualifications();

      addNotification({
        title: 'Succès',
        message: 'Qualification supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting qualification:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la suppression de la qualification',
        type: 'error'
      });
    }
  };

  const QualificationForm = ({ defaultValues, onSubmit }: { defaultValues?: Partial<QualificationFormValues>, onSubmit: (data: QualificationFormValues) => void }) => {
    const form = useForm<QualificationFormValues>({
      resolver: zodResolver(qualificationSchema),
      defaultValues: {
        name: '',
        issuer: '',
        issue_date: new Date(),
        expiry_date: null,
        type: 'certification',
        description: '',
        ...defaultValues,
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de la qualification</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Certification CrossFit, Diplôme STAPS, etc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issuer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Émetteur</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Université, Organisation, etc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issue_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'obtention</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'expiration (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {qualificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optionnel)</FormLabel>
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

  const getTypeLabel = (type: string) => {
    const found = qualificationTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Qualifications & Certifications</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une Qualification
        </Button>
      </div>

      {qualifications.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <Award className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Aucune qualification enregistrée</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            Ajouter une Qualification
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {qualifications.map((qualification) => (
            <div key={qualification.id} className="p-4 border rounded-md hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium text-lg">{qualification.name}</div>
                  <div className="text-sm text-gray-500">
                    {qualification.issuer} • {getTypeLabel(qualification.type)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCurrentQualification(qualification);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCurrentQualification(qualification);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                <span>Obtenue le {format(new Date(qualification.issue_date), 'dd/MM/yyyy')}</span>
                {qualification.expiry_date && (
                  <span className="ml-2">• Expire le {format(new Date(qualification.expiry_date), 'dd/MM/yyyy')}</span>
                )}
              </div>
              {qualification.description && (
                <div className="mt-2 text-sm text-gray-600">{qualification.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Qualification Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Qualification</DialogTitle>
            <DialogDescription>
              Enregistrer une nouvelle qualification ou certification.
            </DialogDescription>
          </DialogHeader>
          <QualificationForm onSubmit={handleAddQualification} />
        </DialogContent>
      </Dialog>

      {/* Edit Qualification Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Qualification</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations de la qualification.
            </DialogDescription>
          </DialogHeader>
          {currentQualification && (
            <QualificationForm
              defaultValues={{
                name: currentQualification.name,
                issuer: currentQualification.issuer,
                issue_date: new Date(currentQualification.issue_date),
                expiry_date: currentQualification.expiry_date ? new Date(currentQualification.expiry_date) : null,
                type: currentQualification.type,
                description: currentQualification.description
              }}
              onSubmit={handleEditQualification}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Qualification Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la Qualification</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette qualification ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQualification}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffQualifications;