import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Clock, MoreVertical, Trash, AlertCircle, Edit } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { attendanceSchema, type AttendanceFormValues } from '../lib/validations/attendance';
import { supabase } from '../lib/supabase';
import MemberSearch from '../components/MemberSearch';
import { useNotifications } from '../context/NotificationContext';
import { searchByFullName } from '../lib/utils';
import { AttendanceEditForm } from '../components/AttendanceEditForm';

const ITEMS_PER_PAGE = 10;

const AttendanceForm = ({ 
  defaultValues,
  onSubmit,
  isEditing = false
}: { 
  defaultValues?: Partial<AttendanceFormValues>,
  onSubmit: (data: AttendanceFormValues) => void,
  isEditing?: boolean 
}) => {
  const { addNotification } = useNotifications();
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);
  const [memberStatus, setMemberStatus] = React.useState<{
    isActive: boolean;
    hasValidPayment: boolean;
    membershipType: string | null;
  }>({
    isActive: false,
    hasValidPayment: false,
    membershipType: null
  });

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      memberId: '',
      checkInTime: new Date(),
      type: 'gym',
      notes: '',
      ...defaultValues,
    },
  });

  const checkMemberStatus = async (memberId: string) => {
    try {
      // Get member status and membership type
      const { data: member } = await supabase
        .from('members')
        .select('status, membership_type')
        .eq('id', memberId)
        .single();

      if (!member) {
        throw new Error('Membre non trouvé');
      }

      // Check for valid payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'paid')
        .order('due_date', { ascending: false })
        .limit(1);

      const hasValidPayment = payments && payments.length > 0 && 
        new Date(payments[0].due_date) > new Date();

      setMemberStatus({
        isActive: member.status === 'active',
        hasValidPayment: hasValidPayment,
        membershipType: member.membership_type
      });

      // Show warnings if there are issues
      if (member.status !== 'active') {
        addNotification({
          title: 'Adhésion Inactive',
          message: 'L\'adhésion de ce membre n\'est pas active.',
          type: 'warning'
        });
      }

      if (!hasValidPayment) {
        addNotification({
          title: 'Paiement Requis',
          message: 'Ce membre n\'a pas de paiement valide enregistré.',
          type: 'warning'
        });
      }

    } catch (error) {
      console.error('Error checking member status:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la vérification du statut du membre',
        type: 'error'
      });
    }
  };

  const handleMemberSelect = (member: { id: string }) => {
    setSelectedMemberId(member.id);
    form.setValue('memberId', member.id);
    checkMemberStatus(member.id);
  };

  React.useEffect(() => {
    if (defaultValues?.memberId) {
      setSelectedMemberId(defaultValues.memberId);
      checkMemberStatus(defaultValues.memberId);
    }
  }, [defaultValues?.memberId]);

  const handleSubmit = async (data: AttendanceFormValues) => {
    if (!memberStatus.hasValidPayment) {
      addNotification({
        title: 'Impossible d\'Enregistrer la Présence',
        message: 'Le membre doit avoir un paiement valide pour enregistrer la présence.',
        type: 'error'
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Membre</FormLabel>
              <FormControl>
                <MemberSearch 
                  onSelect={handleMemberSelect} 
                  defaultValue={field.value} 
                  showSelectedOnly={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMemberId && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                memberStatus.isActive ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                Statut d'Adhésion: <span className="font-medium capitalize">{
                  memberStatus.isActive ? 'Actif' : 'Inactif'
                }</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                memberStatus.hasValidPayment ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                Statut de Paiement: <span className="font-medium">{
                  memberStatus.hasValidPayment ? 'Valide' : 'Paiement Requis'
                }</span>
              </span>
            </div>
            {memberStatus.membershipType && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">
                  Type d'Adhésion: <span className="font-medium capitalize">{
                    memberStatus.membershipType
                  }</span>
                </span>
              </div>
            )}
          </div>
        )}

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

        <Button 
          type="submit" 
          className="w-full"
          disabled={!memberStatus.hasValidPayment}
        >
          {isEditing ? 'Mettre à Jour la Présence' : 'Enregistrer la Présence'}
        </Button>

        {selectedMemberId && !memberStatus.hasValidPayment && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-800 rounded-md">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Impossible d'enregistrer la présence</p>
              <p>Le membre doit avoir un paiement valide pour enregistrer la présence.</p>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

const Attendance = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const { addNotification } = useNotifications();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const pageSize = 10;

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on current page
      const targetDate = subDays(new Date(), currentPage - 1);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);
      
  

      // Fetch attendance for the specific date
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          *,
          member:members(first_name, last_name)
        `)
        .gte('check_in_time', dayStart.toISOString())
        .lt('check_in_time', dayEnd.toISOString())
        .order('check_in_time', { ascending: false });

      if (error) throw error;

      // Filter based on search term if provided
      const filteredData = searchTerm 
        ? attendanceData?.filter(record => 
            searchByFullName(searchTerm, record.member.first_name, record.member.last_name)
          )
        : attendanceData;

      setAttendance(filteredData || []);
      setTotalRecords(filteredData?.length || 0);

    } catch (error) {
      console.error('Error fetching attendance:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la récupération des enregistrements de présence',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAttendance();
  }, [currentPage, searchTerm]);

  const handleCreateAttendance = async (data: AttendanceFormValues) => {
    try {
      const { error } = await supabase.from('attendance').insert([{
        member_id: data.memberId,
        check_in_time: data.checkInTime.toISOString(),
        type: data.type,
        notes: data.notes
      }]);

      if (error) throw error;

      await fetchAttendance();
      setIsAddDialogOpen(false);
      addNotification({
        title: 'Succès',
        message: 'Présence enregistrée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating attendance:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de l\'enregistrement de la présence',
        type: 'error'
      });
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update only the specific record
      setAttendance(prev => prev.map(record => 
        record.id === id 
          ? { ...record, check_out_time: new Date().toISOString() }
          : record
      ));

      addNotification({
        title: 'Succès',
        message: 'Départ enregistré avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error checking out:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de l\'enregistrement du départ',
        type: 'error'
      });
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove the deleted record from the state
      setAttendance(prev => prev.filter(record => record.id !== id));
      setTotalRecords(prev => prev - 1);

      addNotification({
        title: 'Succès',
        message: 'Présence supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la suppression de la présence',
        type: 'error'
      });
    }
  };

  const handleEditAttendance = async (data: any) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          check_in_time: new Date(data.checkInTime).toISOString(),
          type: data.type,
          notes: data.notes,
          check_out_time: null // Reset checkout when editing
        })
        .eq('id', selectedAttendance.id);

      if (error) throw error;

      await fetchAttendance();
      setIsEditDialogOpen(false);
      setSelectedAttendance(null);
      addNotification({
        title: 'Succès',
        message: 'Présence mise à jour avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la mise à jour de la présence',
        type: 'error'
      });
    }
  };

  const formatTime = (date: string) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'En Cours';
    
    const duration = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60);
    const hours = Math.floor(duration / 60);
    const minutes = Math.floor(duration % 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateHeader = (page: number) => {
    const date = subDays(new Date(), page - 1);
    if (page === 1) {
      return "Aujourd'hui";
    } else if (page === 2) {
      return "Hier";
    } else {
      return format(date, 'dd MMMM yyyy', { locale: fr });
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  const isToday = currentPage === 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Présence</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Enregistrer la Présence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer la Présence</DialogTitle>
              <DialogDescription>
                Enregistrez les détails de présence du membre ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <AttendanceForm onSubmit={handleCreateAttendance} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher les enregistrements de présence..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-medium">
            {formatDateHeader(currentPage)}
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
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
            ) : attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Aucun enregistrement de présence trouvé
                </TableCell>
              </TableRow>
            ) : (
              attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell 
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/members/${record.member_id}`)}
                  >
                    {`${record.member.first_name} ${record.member.last_name}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{formatTime(record.check_in_time)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{record.check_out_time ? formatTime(record.check_out_time) : '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDuration(record.check_in_time, record.check_out_time)}
                  </TableCell>
                  <TableCell className="capitalize">{record.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {!record.check_out_time && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(record.id)}
                        >
                          Check Out
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedAttendance(record);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                            </DialogTrigger>
                            {selectedAttendance && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier la Présence</DialogTitle>
                                  <DialogDescription>
                                    Mettez à jour les détails de présence ci-dessous.
                                  </DialogDescription>
                                </DialogHeader>
                                <AttendanceEditForm
                                  defaultValues={{
                                    checkInTime: selectedAttendance.check_in_time,
                                    type: selectedAttendance.type,
                                    notes: selectedAttendance.notes
                                  }}
                                  onSubmit={handleEditAttendance}
                                />
                              </DialogContent>
                            )}
                          </Dialog>
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={() => handleDeleteAttendance(record.id)}
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

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-500">
            {formatDateHeader(currentPage)}
          </div>
          <div className="flex items-center space-x-2">
            {!isToday && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(1)}
              >
                Aujourd'hui
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Plus Récent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Plus Ancien
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;