import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash,
  Calendar,
  Clock,
  Users,
  DumbbellIcon,
  Ban,
  Filter,
  Check,
  MapPin,
  User,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { ClassFormValues, classDays, classCategories, classDifficulties } from '../lib/validations/class';
import ClassForm from '../components/ClassForm';

const ITEMS_PER_PAGE = 10;

const getCategoryLabel = (value: string) => {
  const category = classCategories.find(cat => cat.value === value);
  return category ? category.label : value;
};

const getDifficultyLabel = (value: string) => {
  const difficulty = classDifficulties.find(diff => diff.value === value);
  return difficulty ? difficulty.label : value;
};

const getDayLabel = (value: string) => {
  const day = classDays.find(d => d.value === value);
  return day ? day.label : value;
};

// Mock class data
const mockClasses = [
  {
    id: '1',
    name: 'Power Yoga',
    description: 'Une approche vigoureuse du yoga de style vinyasa basee sur le fitness.',
    instructor: 'Sarah Johnson',
    capacity: 25,
    duration: 60,
    day: 'monday',
    startTime: '07:00',
    endTime: '08:00',
    location: 'Studio A',
    category: 'mind_body',
    difficulty: 'intermediate',
    isActive: true,
    created_at: '2023-01-15T08:00:00.000Z',
    updated_at: '2023-01-15T08:00:00.000Z',
    current_enrollments: 18
  },
  {
    id: '2',
    name: 'Cours de Velo',
    description: 'Entrainement intense de cyclisme en salle sur une musique energisante.',
    instructor: 'Mike Davis',
    capacity: 20,
    duration: 45,
    day: 'tuesday',
    startTime: '17:30',
    endTime: '18:15',
    location: 'Salle de Velo',
    category: 'cardio',
    difficulty: 'all_levels',
    isActive: true,
    created_at: '2023-01-16T09:00:00.000Z',
    updated_at: '2023-01-16T09:00:00.000Z',
    current_enrollments: 15
  },
  {
    id: '3',
    name: 'Entrainement HIIT',
    description: 'Entrainement par intervalles de haute intensite combinant cardio et force.',
    instructor: 'Alex Smith',
    capacity: 15,
    duration: 30,
    day: 'wednesday',
    startTime: '12:00',
    endTime: '12:30',
    location: 'Zone Entrainement Fonctionnel',
    category: 'strength',
    difficulty: 'advanced',
    isActive: true,
    created_at: '2023-01-17T10:00:00.000Z',
    updated_at: '2023-01-17T10:00:00.000Z',
    current_enrollments: 10
  },
  {
    id: '4',
    name: 'Pilates Base',
    description: 'Exercices de renforcement du centre axés sur l\'alignement, la respiration et le controle.',
    instructor: 'Emma Wilson',
    capacity: 15,
    duration: 60,
    day: 'thursday',
    startTime: '18:00',
    endTime: '19:00',
    location: 'Studio B',
    category: 'flexibility',
    difficulty: 'beginner',
    isActive: true,
    created_at: '2023-01-18T11:00:00.000Z',
    updated_at: '2023-01-18T11:00:00.000Z',
    current_enrollments: 12
  },
  {
    id: '5',
    name: 'Zumba',
    description: 'Programme de fitness danse avec de la musique latine et internationale.',
    instructor: 'Maria Lopez',
    capacity: 30,
    duration: 60,
    day: 'friday',
    startTime: '19:00',
    endTime: '20:00',
    location: 'Studio A',
    category: 'dance',
    difficulty: 'all_levels',
    isActive: true,
    created_at: '2023-01-19T12:00:00.000Z',
    updated_at: '2023-01-19T12:00:00.000Z',
    current_enrollments: 25
  },
  {
    id: '6',
    name: 'Camp d\'entrainement',
    description: 'Entrainement en circuit inspire du style militaire pour un conditionnement complet du corps.',
    instructor: 'Jack Thompson',
    capacity: 20,
    duration: 45,
    day: 'saturday',
    startTime: '09:00',
    endTime: '09:45',
    location: 'Zone Exterieure',
    category: 'strength',
    difficulty: 'advanced',
    isActive: false,
    created_at: '2023-01-20T13:00:00.000Z',
    updated_at: '2023-01-20T13:00:00.000Z',
    current_enrollments: 0
  }
];

const ClassScheduleByDay = ({ classes, onEdit, onDelete }) => {
  const groupedClasses = classDays.reduce((acc, day) => {
    acc[day.value] = classes.filter(cls => cls.day === day.value && cls.isActive);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {classDays.map(day => (
        <div key={day.value} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{day.label}</h3>
          </div>
          
          {groupedClasses[day.value].length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun cours prevu pour {day.label}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groupedClasses[day.value]
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(cls => (
                  <div key={cls.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{cls.name}</h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {cls.startTime} - {cls.endTime}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {cls.location}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {cls.instructor}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {cls.current_enrollments}/{cls.capacity}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(cls.category)}
                        </span>
                        <div className="mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(cls)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => onDelete(cls)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ClassesTable = ({ classes, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom du Cours</TableHead>
            <TableHead>Horaire</TableHead>
            <TableHead>Instructeur</TableHead>
            <TableHead>Emplacement</TableHead>
            <TableHead>Categorie</TableHead>
            <TableHead>Difficulte</TableHead>
            <TableHead>Capacite</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                Aucun cours trouve
              </TableCell>
            </TableRow>
          ) : (
            classes.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell className="font-medium">{cls.name}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{getDayLabel(cls.day)}</div>
                    <div className="text-gray-500 text-sm">{cls.startTime} - {cls.endTime}</div>
                  </div>
                </TableCell>
                <TableCell>{cls.instructor}</TableCell>
                <TableCell>{cls.location}</TableCell>
                <TableCell>{getCategoryLabel(cls.category)}</TableCell>
                <TableCell>{getDifficultyLabel(cls.difficulty)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="mr-2">{cls.current_enrollments}/{cls.capacity}</div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(cls.current_enrollments / cls.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {cls.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Ban className="h-3 w-3 mr-1" />
                      Inactif
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(cls)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => onDelete(cls)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const Classes = () => {
  const { addNotification } = useNotifications();
  const [classes, setClasses] = useState(mockClasses);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [viewMode, setViewMode] = useState<'table' | 'schedule'>('schedule');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const handleAddClass = async (data: ClassFormValues) => {
    try {
      // In a real app, you would save to Supabase or other backend
      // For this demo, we'll just update the local state
      const newClass = {
        id: (classes.length + 1).toString(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_enrollments: 0
      };
      
      setClasses([newClass, ...classes]);
      setIsAddDialogOpen(false);
      
      addNotification({
        title: 'Succes',
        message: 'Cours ajoute avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding class:', error);
      addNotification({
        title: 'Erreur',
        message: 'Echec de l\'ajout du cours',
        type: 'error'
      });
    }
  };

  const handleEditClass = async (data: ClassFormValues) => {
    try {
      if (!currentClass) return;
      
      // In a real app, you would update in Supabase
      const updatedClass = {
        ...currentClass,
        ...data,
        updated_at: new Date().toISOString()
      };
      
      setClasses(classes.map(cls => cls.id === currentClass.id ? updatedClass : cls));
      setIsEditDialogOpen(false);
      setCurrentClass(null);
      
      addNotification({
        title: 'Succes',
        message: 'Cours mis a jour avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating class:', error);
      addNotification({
        title: 'Erreur',
        message: 'Echec de la mise a jour du cours',
        type: 'error'
      });
    }
  };

  const handleDeleteClass = async () => {
    try {
      if (!currentClass) return;
      
      // In a real app, you would delete from Supabase
      setClasses(classes.filter(cls => cls.id !== currentClass.id));
      setIsDeleteDialogOpen(false);
      setCurrentClass(null);
      
      addNotification({
        title: 'Succes',
        message: 'Cours supprime avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      addNotification({
        title: 'Erreur',
        message: 'Echec de la suppression du cours',
        type: 'error'
      });
    }
  };

  const openEditDialog = (cls) => {
    setCurrentClass(cls);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cls) => {
    setCurrentClass(cls);
    setIsDeleteDialogOpen(true);
  };

  const filteredClasses = classes.filter(cls => 
    (cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
     cls.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!categoryFilter || cls.category === categoryFilter)
  );

  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);

  const classesStats = {
    totalClasses: classes.length,
    activeClasses: classes.filter(cls => cls.isActive).length,
    totalCapacity: classes.reduce((sum, cls) => sum + cls.capacity, 0),
    totalEnrollments: classes.reduce((sum, cls) => sum + cls.current_enrollments, 0),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Cours</h1>
          <p className="text-sm text-gray-500 mt-1">Gerez l'emploi du temps et les details des cours de votre salle de sport</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Nouveau Cours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un Nouveau Cours</DialogTitle>
              <DialogDescription>
                Remplissez le formulaire ci-dessous pour creer un nouveau cours.
              </DialogDescription>
            </DialogHeader>
            <ClassForm onSubmit={handleAddClass} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total des Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classesStats.totalClasses}</div>
            <p className="text-xs text-gray-600 flex items-center mt-1">
              {classesStats.activeClasses} actifs, {classesStats.totalClasses - classesStats.activeClasses} inactifs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sessions Hebdomadaires Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.filter(cls => cls.isActive).length}</div>
            <p className="text-xs text-gray-600 flex items-center mt-1">
              Sur {new Set(classes.filter(cls => cls.isActive).map(cls => cls.day)).size} jours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Capacite Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classesStats.totalCapacity}</div>
            <p className="text-xs text-gray-600 flex items-center mt-1">
              {Math.round((classesStats.totalEnrollments / classesStats.totalCapacity) * 100)}% taux d'utilisation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Categorie la Plus Populaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {
                Object.entries(
                  classes.reduce((acc, cls) => {
                    acc[cls.category] = (acc[cls.category] || 0) + cls.current_enrollments;
                    return acc;
                  }, {})
                )
                .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]
                .replace('_', ' ') || 'Aucune'
              }
            </div>
            <p className="text-xs text-gray-600 flex items-center mt-1">
              Base sur les inscriptions actuelles
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex items-center max-w-md">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher des cours..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="rounded-md border border-gray-300 text-sm py-2 px-3"
          >
            <option value="">Toutes les Categories</option>
            {classCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          
          <div className="flex rounded-md overflow-hidden">
            <button
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'schedule' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('schedule')}
            >
              <Calendar className="h-4 w-4 inline-block mr-1" />
              Emploi du temps
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('table')}
            >
              <DumbbellIcon className="h-4 w-4 inline-block mr-1" />
              Cours
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'schedule' ? (
        <ClassScheduleByDay 
          classes={filteredClasses} 
          onEdit={openEditDialog} 
          onDelete={openDeleteDialog} 
        />
      ) : (
        <>
          <ClassesTable 
            classes={paginatedClasses} 
            onEdit={openEditDialog} 
            onDelete={openDeleteDialog} 
          />
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Affichage de {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredClasses.length)} sur {filteredClasses.length} cours
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le Cours</DialogTitle>
            <DialogDescription>
              Mettez a jour les informations du cours ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {currentClass && (
            <ClassForm 
              defaultValues={{
                name: currentClass.name,
                description: currentClass.description,
                instructor: currentClass.instructor,
                capacity: currentClass.capacity,
                duration: currentClass.duration,
                day: currentClass.day,
                startTime: currentClass.startTime,
                endTime: currentClass.endTime,
                location: currentClass.location,
                category: currentClass.category,
                difficulty: currentClass.difficulty,
                isActive: currentClass.isActive,
              }}
              onSubmit={handleEditClass}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le Cours</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer "{currentClass?.name}" ? Cette action ne peut pas etre annulee.
              {currentClass?.current_enrollments > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    Ce cours a {currentClass?.current_enrollments} inscriptions actives. 
                    La suppression affectera les membres actuellement inscrits.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Classes;