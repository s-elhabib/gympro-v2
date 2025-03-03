import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, MoreVertical, Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { memberSchema, type MemberFormValues } from '../lib/validations/member';
import { supabase } from '../lib/supabase';
import MemberForm from '../components/MemberForm';
import { searchByFullName } from '../lib/utils';

const Members = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [members, setMembers] = React.useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = React.useState<any[]>([]);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const pageSize = 10;

  // Calculate total pages
  const totalPages = Math.ceil(totalRecords / pageSize);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error, count } = await supabase
        .from('members')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
      setTotalRecords(count || 0);
      filterMembers(data || [], searchTerm);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error("Échec de la récupération des membres");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter members based on search term
  const filterMembers = (membersData: any[], term: string) => {
    const filtered = membersData.filter(member => 
      searchByFullName(term, member.first_name, member.last_name) ||
      member.email.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredMembers(filtered);
    setTotalRecords(filtered.length);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Update filtered members when search term changes
  React.useEffect(() => {
    filterMembers(members, searchTerm);
  }, [searchTerm, members]);

  // Initial fetch
  React.useEffect(() => {
    fetchMembers();
  }, []);

  // Get current page items
  const getCurrentPageItems = () => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredMembers.slice(start, end);
  };

  const handleCreateMember = async (data: MemberFormValues) => {
    try {
      const { error } = await supabase.from('members').insert([{
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        membership_type: data.membershipType,
        start_date: data.startDate.toISOString(),
        status: data.status,
        notes: data.notes || null
      }]);

      if (error) throw error;

      await fetchMembers();
      setIsAddDialogOpen(false);
      toast.success("Membre créé avec succès");
    } catch (error) {
      console.error('Error creating member:', error);
      toast.error("Échec de la création du membre");
    }
  };

  const handleEditMember = async (data: MemberFormValues) => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          membership_type: data.membershipType,
          start_date: data.startDate.toISOString(),
          status: data.status,
          notes: data.notes || null
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      await fetchMembers();
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      toast.success("Membre mis à jour avec succès");
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error("Échec de la mise à jour du membre");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) throw error;

      await fetchMembers();
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      toast.success("Membre supprimé avec succès");
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error("Échec de la suppression du membre");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Membres</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Membre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouveau Membre</DialogTitle>
                <DialogDescription>
                  Remplissez les détails du membre ci-dessous.
                </DialogDescription>
              </DialogHeader>
              <MemberForm onSubmit={handleCreateMember} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher des membres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[800px] px-4 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Aucun membre trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    getCurrentPageItems().map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{`${member.first_name} ${member.last_name}`}</TableCell>
                        <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">{member.phone}</TableCell>
                        <TableCell className="capitalize">{member.membership_type}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.status === 'active' ? 'bg-green-100 text-green-800' :
                            member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {member.status === 'active' ? 'Actif' : 
                             member.status === 'inactive' ? 'Inactif' : 
                             'Suspendu'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/members/${member.id}`)}
                              className="hidden sm:inline-flex"
                            >
                              Voir
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="sm:hidden"
                                  onClick={() => navigate(`/members/${member.id}`)}
                                >
                                  Voir
                                </DropdownMenuItem>
                                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => {
                                      e.preventDefault();
                                      setSelectedMember(member);
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  {selectedMember && (
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Modifier le Membre</DialogTitle>
                                        <DialogDescription>
                                          Mettez à jour les détails du membre ci-dessous.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <MemberForm
                                        defaultValues={{
                                          firstName: selectedMember.first_name,
                                          lastName: selectedMember.last_name,
                                          email: selectedMember.email,
                                          phone: selectedMember.phone,
                                          membershipType: selectedMember.membership_type,
                                          startDate: new Date(selectedMember.start_date),
                                          status: selectedMember.status,
                                          notes: selectedMember.notes || ''
                                        }}
                                        onSubmit={handleEditMember}
                                        isEditing
                                      />
                                    </DialogContent>
                                  )}
                                </Dialog>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setSelectedMember(member);
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
            </div>
          </div>

          {/* Add pagination controls */}
          {filteredMembers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
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
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement le membre
              et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setSelectedMember(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Members;