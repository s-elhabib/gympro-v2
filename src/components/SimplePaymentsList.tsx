import React, { useRef } from 'react';
import { Calendar, Edit, MoreVertical, Trash } from 'lucide-react';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Payment, PaymentWithDisplayStatus } from '../types';
import { getStatusColor, translateStatus, translatePaymentMethod } from '../lib/utils/payment';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { PaymentFormValues } from '../lib/validations/payment';

interface SimplePaymentsListProps {
  payments: PaymentWithDisplayStatus[];
  isLoading: boolean;
  hasNextPage: boolean;
  loadMoreItems: () => Promise<void>;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedPayment: Payment | null;
  setSelectedPayment: (payment: Payment | null) => void;
  handleUpdatePayment: (data: PaymentFormValues) => Promise<void>;
  handleDeletePayment: (id: string) => Promise<void>;
  PaymentForm: React.ComponentType<{
    defaultValues?: Partial<PaymentFormValues>;
    onSubmit: (data: PaymentFormValues) => void;
    isEditing?: boolean;
  }>;
}

const SimplePaymentsList: React.FC<SimplePaymentsListProps> = ({
  payments,
  isLoading,
  hasNextPage,
  loadMoreItems,
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedPayment,
  setSelectedPayment,
  handleUpdatePayment,
  handleDeletePayment,
  PaymentForm,
}) => {
  const navigate = useNavigate();
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";

    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "-";
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  // Helper function to calculate days difference for overdue payments
  const getDaysDifference = (dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    return differenceInDays(today, due);
  };

  // Set up intersection observer for infinite scrolling
  React.useEffect(() => {
    if (!hasNextPage || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          setIsLoadingMore(true);
          loadMoreItems().finally(() => setIsLoadingMore(false));
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasNextPage, loadMoreItems, isLoadingMore]);

  if (isLoading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        Aucun paiement trouvé
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell
                className="cursor-pointer hover:text-blue-600"
                onClick={() => navigate(`/members/${payment.member_id}`)}
              >
                {`${payment.member.first_name} ${payment.member.last_name}`}
              </TableCell>
              <TableCell>{payment.amount.toFixed(2)} MAD</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(payment.due_date)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      payment.displayStatus
                    )}`}
                  >
                    {translateStatus(payment.displayStatus)}
                  </span>
                  {(payment.displayStatus === "overdue" ||
                    payment.displayStatus === "near_overdue") &&
                    getDaysDifference(payment.due_date) !== 0 && (
                      <span
                        className={`
                      inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                      ${
                        payment.displayStatus === "overdue"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-orange-50 text-orange-700 border border-orange-200"
                      }
                    `}
                      >
                        {`${Math.abs(getDaysDifference(payment.due_date))}j`}
                      </span>
                    )}
                </div>
              </TableCell>
              <TableCell className="capitalize">
                {translatePaymentMethod(payment.payment_method)}
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
                      <Dialog
                        open={isEditDialogOpen && selectedPayment?.id === payment.id}
                        onOpenChange={(open) => {
                          if (!open) setSelectedPayment(null);
                          setIsEditDialogOpen(open);
                        }}
                      >
                        <DialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setSelectedPayment(payment);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        </DialogTrigger>
                        {selectedPayment && selectedPayment.id === payment.id && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Modifier le Paiement
                              </DialogTitle>
                              <DialogDescription>
                                Mettez a jour les details du paiement
                                ci-dessous.
                              </DialogDescription>
                            </DialogHeader>
                            <PaymentForm
                              defaultValues={{
                                memberId: selectedPayment.member_id,
                                // membershipType will be fetched by the form when member is loaded
                                amount: selectedPayment.amount,
                                paymentDate: new Date(
                                  selectedPayment.payment_date
                                ),
                                dueDate: new Date(selectedPayment.due_date),
                                status: selectedPayment.status,
                                paymentMethod:
                                  selectedPayment.payment_method,
                                notes: selectedPayment.notes || "",
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
          ))}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div
          ref={loaderRef}
          className="flex justify-center items-center p-4"
        >
          {isLoadingMore ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <Button
              variant="outline"
              onClick={() => loadMoreItems()}
            >
              Charger plus
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SimplePaymentsList;
