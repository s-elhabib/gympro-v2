import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Star, StarHalf, Calendar } from 'lucide-react';
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

const performanceCategories = [
  { value: 'attendance', label: 'Assiduité' },
  { value: 'customer_service', label: 'Service Client' },
  { value: 'technical_skills', label: 'Compétences Techniques' },
  { value: 'teamwork', label: 'Travail d\'Équipe' },
  { value: 'overall', label: 'Évaluation Globale' },
];

const performanceSchema = z.object({
  evaluation_date: z.date(),
  evaluator: z.string().min(2, 'Le nom de l\'évaluateur doit contenir au moins 2 caractères'),
  rating: z.number().min(1, 'La note doit être entre 1 et 5').max(5, 'La note doit être entre 1 et 5'),
  category: z.enum(['attendance', 'customer_service', 'technical_skills', 'teamwork', 'overall']),
  comments: z.string().optional(),
});

type PerformanceFormValues = z.infer<typeof performanceSchema>;

interface StaffPerformanceProps {
  staffId: string;
}

const StaffPerformance: React.FC<StaffPerformanceProps> = ({ staffId }) => {
  const { addNotification } = useNotifications();
  const [performances, setPerformances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPerformance, setCurrentPerformance] = useState<any>(null);
  const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPerformances();
  }, [staffId]);

  const fetchPerformances = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('staff_performance')
        .select('*')
        .eq('staff_id', staffId)
        .order('evaluation_date', { ascending: false });

      if (error) throw error;

      setPerformances(data || []);

      // Calculate average ratings by category
      if (data && data.length > 0) {
        const categoryTotals: Record<string, { sum: number, count: number }> = {};

        data.forEach(perf => {
          if (!categoryTotals[perf.category]) {
            categoryTotals[perf.category] = { sum: 0, count: 0 };
          }
          categoryTotals[perf.category].sum += perf.rating;
          categoryTotals[perf.category].count += 1;
        });

        const avgRatings: Record<string, number> = {};
        Object.entries(categoryTotals).forEach(([category, { sum, count }]) => {
          avgRatings[category] = sum / count;
        });

        setAverageRatings(avgRatings);
      }
    } catch (error) {
      console.error('Error fetching performances:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les évaluations',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPerformance = async (data: PerformanceFormValues) => {
    try {
      const { error } = await supabase
        .from('staff_performance')
        .insert([{
          staff_id: staffId,
          evaluation_date: data.evaluation_date.toISOString().split('T')[0],
          evaluator: data.evaluator,
          rating: data.rating,
          category: data.category,
          comments: data.comments || ''
        }]);

      if (error) throw error;

      setIsAddDialogOpen(false);
      fetchPerformances();

      addNotification({
        title: 'Succès',
        message: 'Évaluation ajoutée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding performance:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de l\'ajout de l\'évaluation',
        type: 'error'
      });
    }
  };

  const handleEditPerformance = async (data: PerformanceFormValues) => {
    try {
      if (!currentPerformance) return;

      const { error } = await supabase
        .from('staff_performance')
        .update({
          evaluation_date: data.evaluation_date.toISOString().split('T')[0],
          evaluator: data.evaluator,
          rating: data.rating,
          category: data.category,
          comments: data.comments || ''
        })
        .eq('id', currentPerformance.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setCurrentPerformance(null);
      fetchPerformances();

      addNotification({
        title: 'Succès',
        message: 'Évaluation mise à jour avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating performance:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la mise à jour de l\'évaluation',
        type: 'error'
      });
    }
  };

  const handleDeletePerformance = async () => {
    try {
      if (!currentPerformance) return;

      const { error } = await supabase
        .from('staff_performance')
        .delete()
        .eq('id', currentPerformance.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setCurrentPerformance(null);
      fetchPerformances();

      addNotification({
        title: 'Succès',
        message: 'Évaluation supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting performance:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la suppression de l\'évaluation',
        type: 'error'
      });
    }
  };

  const PerformanceForm = ({ defaultValues, onSubmit }: { defaultValues?: Partial<PerformanceFormValues>, onSubmit: (data: PerformanceFormValues) => void }) => {
    const form = useForm<PerformanceFormValues>({
      resolver: zodResolver(performanceSchema),
      defaultValues: {
        evaluation_date: new Date(),
        evaluator: '',
        rating: 3,
        category: 'overall',
        comments: '',
        ...defaultValues,
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="evaluation_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date d'évaluation</FormLabel>
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
            name="evaluator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Évaluateur</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nom de l'évaluateur" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {performanceCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
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
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commentaires (optionnel)</FormLabel>
                <FormControl>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Commentaires sur la performance..."
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

  const getCategoryLabel = (category: string) => {
    const found = performanceCategories.find(c => c.value === category);
    return found ? found.label : category;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      {Object.keys(averageRatings).length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md border">
          <h4 className="font-medium mb-3">Résumé des Performances</h4>
          <div className="space-y-2">
            {Object.entries(averageRatings).map(([category, rating]) => (
              <div key={category} className="flex justify-between items-center">
                <span>{getCategoryLabel(category)}</span>
                <div className="flex items-center">
                  <span className="mr-2 font-medium">{rating.toFixed(1)}</span>
                  {renderStars(rating)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Évaluations de Performance</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une Évaluation
        </Button>
      </div>

      {performances.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <StarHalf className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Aucune évaluation enregistrée</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            Ajouter une Évaluation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {performances.map((performance) => (
            <div key={performance.id} className="p-4 border rounded-md hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{getCategoryLabel(performance.category)}</div>
                  <div className="text-sm text-gray-500">
                    Évalué par {performance.evaluator}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="mr-2 font-medium">{performance.rating}</span>
                    {renderStars(performance.rating)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCurrentPerformance(performance);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCurrentPerformance(performance);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                <span>Évalué le {format(new Date(performance.evaluation_date), 'dd/MM/yyyy')}</span>
              </div>
              {performance.comments && (
                <div className="mt-2 text-sm text-gray-600">{performance.comments}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Performance Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Évaluation</DialogTitle>
            <DialogDescription>
              Enregistrer une nouvelle évaluation de performance.
            </DialogDescription>
          </DialogHeader>
          <PerformanceForm onSubmit={handleAddPerformance} />
        </DialogContent>
      </Dialog>

      {/* Edit Performance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'Évaluation</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations de l'évaluation.
            </DialogDescription>
          </DialogHeader>
          {currentPerformance && (
            <PerformanceForm
              defaultValues={{
                evaluation_date: new Date(currentPerformance.evaluation_date),
                evaluator: currentPerformance.evaluator,
                rating: currentPerformance.rating,
                category: currentPerformance.category,
                comments: currentPerformance.comments
              }}
              onSubmit={handleEditPerformance}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Performance Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'Évaluation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerformance}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffPerformance;
