import React, { useRef, useEffect } from "react";
import { Calendar, Edit, MoreVertical, Trash } from "lucide-react";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Payment, PaymentWithDisplayStatus } from "../types";
import {
  getStatusColor,
  translateStatus,
  translatePaymentMethod,
} from "../lib/utils/payment";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { PaymentFormValues } from "../lib/validations/payment";

interface VirtualizedPaymentsListProps {
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

const VirtualizedPaymentsList: React.FC<VirtualizedPaymentsListProps> = ({
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
  const listRef = useRef<List>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = React.useState(0);
  const [tableHeight, setTableHeight] = React.useState(0);

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

  // Update table dimensions when window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.offsetWidth);
        // Set a fixed height or calculate based on viewport
        setTableHeight(window.innerHeight * 0.6); // 60% of viewport height
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Item count for infinite loader
  const itemCount = hasNextPage ? payments.length + 1 : payments.length;

  // Check if an item is loaded
  const isItemLoaded = (index: number) =>
    !hasNextPage || index < payments.length;

  // Render a payment row
  const PaymentRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    // If we're loading the last item, show a loading indicator
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const payment = payments[index];

    return (
      <div style={style}>
        <TableRow className="border-b">
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
                getDaysDifference(payment.due_date) > 0 && (
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
                    {`${getDaysDifference(payment.due_date)}j`}
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
                    open={
                      isEditDialogOpen && selectedPayment?.id === payment.id
                    }
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
                          <DialogTitle>Modifier le Paiement</DialogTitle>
                          <DialogDescription>
                            Mettez a jour les details du paiement ci-dessous.
                          </DialogDescription>
                        </DialogHeader>
                        <PaymentForm
                          defaultValues={{
                            memberId: selectedPayment.member_id,
                            // membershipType will be fetched by the form when member is loaded
                            amount: selectedPayment.amount,
                            paymentDate: new Date(selectedPayment.payment_date),
                            dueDate: new Date(selectedPayment.due_date),
                            status: selectedPayment.status,
                            paymentMethod: selectedPayment.payment_method,
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
      </div>
    );
  };

  if (isLoading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (payments.length === 0) {
    return <div className="text-center py-8">Aucun paiement trouvé</div>;
  }

  return (
    <div
      ref={tableRef}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
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
      </Table>

      <div className="overflow-auto">
        {tableWidth > 0 && tableHeight > 0 && (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={(listInstance) => {
                  // @ts-ignore - types are not perfectly aligned
                  ref(listInstance);
                  listRef.current = listInstance;
                }}
                height={tableHeight}
                width={tableWidth}
                itemCount={itemCount}
                itemSize={70} // Adjust based on your row height
                onItemsRendered={onItemsRendered}
              >
                {PaymentRow}
              </List>
            )}
          </InfiniteLoader>
        )}
      </div>
    </div>
  );
};

export default VirtualizedPaymentsList;
