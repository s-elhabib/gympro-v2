import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash,
  SlidersHorizontal,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Eye
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
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { StaffFormValues } from '../lib/validations/staff';
import StaffForm from '../components/StaffForm';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 10;

const Staff = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [staff, setStaff] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [currentStaff, setCurrentStaff] = React.useState<any>(null);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter based on search term
      const filteredData = data?.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

      // Update total count based on filtered data
      setTotalRecords(filteredData.length);

      // Paginate the filtered data
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setStaff(filteredData.slice(start, end));

    } catch (error) {
      console.error('Error fetching staff:', error);
      addNotification({
        title: 'Erreur',
        message: 'Echec de recuperation des donnees du personnel',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (data: StaffFormValues) => {
    try {
      const { error } = await supabase
        .from('staff')
        .insert([{
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          hire_date: data.hireDate.toISOString().split('T')[0],
          status: data.status,
          notes: data.notes || ''
        }]);

      if (error) throw error;

      setIsAddDialogOpen(false);
      fetchStaff();

      addNotification({
        title: 'Succes',
        message: 'Membre du personnel ajoute avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      addNotification({
        title: 'Erreur',
        message: 'Echec de l\'ajout du membre du personnel',
        type: 'error'
      });
    }
  };

  const handleEditStaff = async (data: StaffFormValues) => {
    try {
      if (!currentStaff) return;

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
        .eq('id', currentStaff.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setCurrentStaff(null);
      fetchStaff();

      addNotification({
        title: 'Succes',
        message: 'Membre du personnel mis a jour avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      addNotification({
        title: 'Erreur',
        message: 'Echec de la mise a jour du membre du personnel',
        type: 'error'
      });
    }
  };

  const handleDeleteStaff = async () => {
    try {
      if (!currentStaff) return;

      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', currentStaff.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setCurrentStaff(null);
      fetchStaff();

      addNotification({
        title: 'Succes',
        message: 'Membre du personnel supprime avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      addNotification({
        title: 'Erreur',
        message: 'Echec de la suppression du membre du personnel',
        type: 'error'
      });
    }
  };

  const handleExport = async () => {
    try {
      // Get all staff data (not just current page)
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data for export
      const exportData = data.map(staff => ({
        'Prénom': staff.first_name,
        'Nom': staff.last_name,
        'Email': staff.email,
        'Téléphone': staff.phone,
        'Rôle': staff.role.replace('_', ' '),
        'Date d\'embauche': format(new Date(staff.hire_date), 'dd/MM/yyyy'),
        'Statut': getStatusText(staff.status),
        'Notes': staff.notes
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Personnel");

      // Generate Excel file
      XLSX.writeFile(wb, `Personnel_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);

      addNotification({
        title: 'Succès',
        message: 'Export Excel réussi',
        type: 'success'
      });
    } catch (error) {
      console.error('Error exporting staff:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de l\'export Excel',
        type: 'error'
      });
    }
  };

  React.useEffect(() => {
    fetchStaff();
  }, [currentPage, searchTerm]);

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'on_leave':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'on_leave':
        return 'En Conge';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion du Personnel</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter un Nouveau Personnel</DialogTitle>
              <DialogDescription>
                Entrez les details du nouveau membre du personnel ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <StaffForm onSubmit={handleAddStaff} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex items-center max-w-md">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher des membres du personnel..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-3">

          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telephone</TableHead>
              <TableHead>Date d'embauche</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Aucun membre du personnel trouve
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow
                  key={member.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/staff/${member.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <span>{`${member.first_name} ${member.last_name}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{member.role.replace('_', ' ')}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>{format(new Date(member.hire_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(member.status)}
                      <span className="capitalize">{getStatusText(member.status)}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/staff/${member.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir Profil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentStaff(member);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setCurrentStaff(member);
                              setIsDeleteDialogOpen(true);
                            }}
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

        {totalRecords > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              Affichage de {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} sur {totalRecords} membres du personnel
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le Membre du Personnel</DialogTitle>
            <DialogDescription>
              Mettre a jour les informations du membre du personnel.
            </DialogDescription>
          </DialogHeader>
          {currentStaff && (
            <StaffForm
              defaultValues={{
                firstName: currentStaff.first_name,
                lastName: currentStaff.last_name,
                email: currentStaff.email,
                phone: currentStaff.phone,
                role: currentStaff.role,
                hireDate: new Date(currentStaff.hire_date),
                status: currentStaff.status,
                notes: currentStaff.notes
              }}
              onSubmit={handleEditStaff}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Etes-vous sur?</AlertDialogTitle>
            <AlertDialogDescription>
              Cela supprimera definitivement l'enregistrement du membre du personnel. Cette action ne peut pas etre annulee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Staff;