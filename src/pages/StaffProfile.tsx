import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, User, Calendar, Award, Clock, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { clearUserRoleCache, refreshCurrentUserData } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import StaffForm from '../components/StaffForm';
import StaffSchedule from '../components/StaffSchedule';
import StaffQualifications from '../components/StaffQualifications';
import StaffPerformance from '../components/StaffPerformance';

const StaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [staff, setStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (id) {
      fetchStaffData();
    }
  }, [id]);

  const fetchStaffData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les données du personnel',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!staff) {
    return <div className="text-center py-8">
      <p className="text-lg text-gray-600">Personnel non trouvé</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/staff')}>
        Retour à la liste du personnel
      </Button>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/staff')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au Personnel
        </Button>
        <Button onClick={() => setIsEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-gray-600" />
              </div>
              <h1 className="text-2xl font-semibold">{`${staff.first_name} ${staff.last_name}`}</h1>
              <span className="inline-block px-3 py-1 rounded-full text-sm capitalize bg-blue-100 text-blue-800 mt-2">
                {staff.role.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{staff.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p>{staff.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date d'embauche</p>
                <p>{new Date(staff.hire_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <p className="capitalize">{staff.status.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Horaires
              </TabsTrigger>
              <TabsTrigger value="qualifications">
                <Award className="h-4 w-4 mr-2" />
                Qualifications
              </TabsTrigger>
              <TabsTrigger value="performance">
                <Clock className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>Horaires de Travail</CardTitle>
                  <CardDescription>Planification hebdomadaire</CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffSchedule staffId={staff.id} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="qualifications">
              <Card>
                <CardHeader>
                  <CardTitle>Qualifications & Certifications</CardTitle>
                  <CardDescription>Compétences et formations</CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffQualifications staffId={staff.id} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Suivi de Performance</CardTitle>
                  <CardDescription>Métriques et évaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffPerformance staffId={staff.id} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Informations supplémentaires</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-md bg-gray-50">
                    <p className="whitespace-pre-wrap">{staff.notes || 'Aucune note disponible.'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le Personnel</DialogTitle>
              <DialogDescription>
                Mettre à jour les informations du membre du personnel.
              </DialogDescription>
            </DialogHeader>
            <StaffForm 
              defaultValues={{
                firstName: staff.first_name,
                lastName: staff.last_name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role,
                hireDate: new Date(staff.hire_date),
                status: staff.status,
                notes: staff.notes
              }}
              onSubmit={async (data) => {
                try {
                  const { error } = await supabase
                    .from('staff')
                    .update({
                      first_name: data.firstName,
                      last_name: data.lastName,
                      email: data.email,
                      phone: data.phone,
                      role: data.role,
                      hire_date: data.hireDate.toISOString().split('T')[0],
                      status: data.status,
                      notes: data.notes || ''
                    })
                    .eq('id', staff.id);

                  if (error) throw error;

                  // Clear cache and refresh auth state if current user's role changed
                  if (staff.email) {
                    clearUserRoleCache(staff.email);

                    // If this is the current user and role changed, refresh their auth state
                    if (user?.email === staff.email && data.role !== staff.role) {
                      console.log('🔄 Current user role changed, refreshing auth state...');
                      await refreshCurrentUserData();
                      addNotification({
                        title: 'Succès',
                        message: 'Votre rôle a été mis à jour. Les nouvelles permissions sont maintenant actives.',
                        type: 'success'
                      });
                    } else {
                      addNotification({
                        title: 'Succès',
                        message: 'Membre du personnel mis à jour avec succès',
                        type: 'success'
                      });
                    }
                  }

                  setIsEditDialogOpen(false);
                  fetchStaffData();
                } catch (error) {
                  console.error('Error updating staff:', error);
                  addNotification({
                    title: 'Erreur',
                    message: 'Échec de la mise à jour du membre du personnel',
                    type: 'error'
                  });
                }
              }}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StaffProfile;
