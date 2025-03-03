import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, MoreVertical, Edit, Trash, Calendar, CalendarPlus } from 'lucide-react';
import { format, isAfter, parseISO, addMonths, isValid, isBefore, addDays, differenceInDays } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { paymentSchema, type PaymentFormValues } from '../lib/validations/payment';
import { supabase } from '../lib/supabase';
import MemberSearch from '../components/MemberSearch';
import { searchByFullName } from '../lib/utils';
import { useNotifications } from '../context/NotificationContext';
import { log } from 'console';

const PaymentForm = ({ 
  defaultValues,
  onSubmit,
  isEditing = false
}: { 
  defaultValues?: Partial<PaymentFormValues>,
  onSubmit: (data: PaymentFormValues) => void,
  isEditing?: boolean 
}) => {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      memberId: '',
      amount: 0,
      paymentDate: new Date(),
      dueDate: new Date(),
      status: 'pending',
      paymentMethod: 'cash',
      notes: '',
      ...defaultValues,
    },
  });

  const handleMemberSelect = (member: { id: string }) => {
    form.setValue('memberId', member.id);
  };

  const handleAddOneMonth = () => {
    const currentDueDate = form.getValues('dueDate');
    const newDueDate = addMonths(currentDueDate, 1);
    form.setValue('dueDate', newDueDate);
  };

  // Helper function to safely format dates
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, 'yyyy-MM-dd');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.value}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de Paiement</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between items-center">
                  <span>Date d'Echeance</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddOneMonth}
                    className="h-6 px-2 text-xs"
                  >
                    <CalendarPlus className="h-3 w-3 mr-1" />
                    +1 Mois
                  </Button>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner le statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="paid">Paye</SelectItem>
                  <SelectItem value="pending">En Attente</SelectItem>
                  <SelectItem value="overdue">En Retard</SelectItem>
                  <SelectItem value="cancelled">Annule</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mode de Paiement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner le mode de paiement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Especes</SelectItem>
                  <SelectItem value="credit_card">Carte de Credit</SelectItem>
                  <SelectItem value="debit_card">Carte de Debit</SelectItem>
                  <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
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
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {isEditing ? 'Mettre a jour le Paiement' : 'Enregistrer le Paiement'}
        </Button>
      </form>
    </Form>
  );
};

const Payments = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const updatePaymentStatus = (payment: any) => {
    const today = new Date();
    const dueDate = parseISO(payment.due_date);
    const sevenDaysFromNow = addDays(today, 7);

    // If payment is cancelled, don't change status
    if (payment.status === 'cancelled') {
      return payment;
    }

    // Check if payment is overdue
    if (isBefore(dueDate, today)) {
      return { ...payment, status: 'overdue' };
    }

    // Check if due date is within next 7 days
    if (isBefore(dueDate, sevenDaysFromNow)) {
      return { ...payment, status: 'near_overdue' };
    }

    // If due date is in the future and not near, status is pending
    return { ...payment, status: 'paid' };
  };

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          member:members(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update payment statuses based on dates
      const updatedPayments = data?.map(payment => updatePaymentStatus(payment));

      setPayments(updatedPayments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de recuperer les paiements',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPayments();
  }, []);

  const handleCreatePayment = async (data: PaymentFormValues) => {
    try {
      const { error } = await supabase.from('payments').insert([{
        member_id: data.memberId,
        amount: data.amount,
        payment_date: data.paymentDate.toISOString(),
        due_date: data.dueDate.toISOString(),
        status: data.status,
        payment_method: data.paymentMethod,
        notes: data.notes || null
      }]);

      if (error) throw error;

      await fetchPayments();
      setIsAddDialogOpen(false);
      addNotification({
        title: 'Succes',
        message: 'Paiement enregistre avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible d\'enregistrer le paiement',
        type: 'error'
      });
    }
  };

  const handleUpdatePayment = async (data: PaymentFormValues) => {
    if (!selectedPayment) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          member_id: data.memberId,
          amount: data.amount,
          payment_date: data.paymentDate.toISOString(),
          due_date: data.dueDate.toISOString(),
          status: data.status,
          payment_method: data.paymentMethod,
          notes: data.notes || null
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      await fetchPayments();
      setIsEditDialogOpen(false);
      setSelectedPayment(null);
      addNotification({
        title: 'Succes',
        message: 'Paiement mis a jour avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de mettre a jour le paiement',
        type: 'error'
      });
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPayments(prev => prev.filter(payment => payment.id !== id));
      addNotification({
        title: 'Succes',
        message: 'Paiement supprime avec succes',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting payment:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de supprimer le paiement',
        type: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'near_overdue':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const getDaysDifference = (dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    const diffInDays = differenceInDays(today, due);
    return diffInDays;
  };

  const filteredPayments = payments.filter(payment => 
    searchByFullName(searchTerm, payment.member.first_name, payment.member.last_name)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Paiements</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Enregistrer un Paiement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer un Paiement</DialogTitle>
              <DialogDescription>
                Saisissez les details du paiement ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <PaymentForm onSubmit={handleCreatePayment} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher des paiements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date d'Echeance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Mode de Paiement</TableHead>
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
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Aucun paiement trouve
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => {
                const updatedPayment = updatePaymentStatus(payment);
                return (
                  <TableRow key={payment.id}>
                    <TableCell 
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => navigate(`/members/${payment.member_id}`)}
                    >
                      {`${payment.member.first_name} ${payment.member.last_name}`}
                    </TableCell>
                    <TableCell>
                      {payment.amount.toFixed(2)} MAD
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(payment.due_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status === 'paid' ? 'Payé' :
                           payment.status === 'pending' ? 'En Attente' :
                           payment.status === 'cancelled' ? 'Annulé' : 
                           payment.status === 'overdue' ? 'En Retard' :
                           payment.status === 'near_overdue' ? 'Échéance Proche' :
                           payment.status}
                        </span>
                        {(payment.status === 'overdue' || payment.status === 'near_overdue') && 
                         getDaysDifference(payment.due_date) !== 0 && (
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                            ${payment.status === 'overdue' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }
                          `}>
                            {payment.status === 'overdue' 
                              ? `+${Math.abs(getDaysDifference(payment.due_date))}j`
                              : `-${Math.abs(getDaysDifference(payment.due_date))}j`
                            }
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method === 'cash' ? 'Especes' :
                       payment.payment_method === 'credit_card' ? 'Carte de Credit' :
                       payment.payment_method === 'debit_card' ? 'Carte de Debit' :
                       payment.payment_method === 'bank_transfer' ? 'Virement Bancaire' :
                       'Autre'}
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
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedPayment(payment);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                              </DialogTrigger>
                              {selectedPayment && (
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Modifier le Paiement</DialogTitle>
                                    <DialogDescription>
                                      Mettez a jour les details du paiement ci-dessous.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <PaymentForm
                                    defaultValues={{
                                      memberId: selectedPayment.member_id,
                                      amount: selectedPayment.amount,
                                      paymentDate: new Date(selectedPayment.payment_date),
                                      dueDate: new Date(selectedPayment.due_date),
                                      status: selectedPayment.status,
                                      paymentMethod: selectedPayment.payment_method,
                                      notes: selectedPayment.notes || ''
                                    }}
                                    onSubmit={handleUpdatePayment}
                                    isEditing
                                  />
                                </DialogContent>
                              )}
                            </Dialog>
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={() => handleDeletePayment(payment.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Payments;