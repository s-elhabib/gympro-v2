import React from "react";
import {
  format,
  isAfter,
  parseISO,
  addDays,
  isBefore,
  differenceInDays,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  due_date: string;
  payment_date: string;
  status: string;
  payment_method: string;
  member: {
    first_name: string;
    last_name: string;
  };
}

interface PaymentHistoryTableProps {
  payments: Payment[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  sortConfig?: SortConfig;
  onRequestSort?: (key: keyof Payment | "member") => void;
}

export type SortConfig = {
  key: keyof Payment | "member";
  direction: "asc" | "desc";
} | null;

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  sortConfig: externalSortConfig,
  onRequestSort: externalRequestSort,
}) => {
  const navigate = useNavigate();
  const [internalSortConfig, setInternalSortConfig] = React.useState<SortConfig>(null);

  // Use external sort config if provided, otherwise use internal
  const sortConfig = externalSortConfig !== undefined ? externalSortConfig : internalSortConfig;

  const requestSort = (key: keyof Payment | "member") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    // If external request sort handler is provided, use it
    if (externalRequestSort) {
      externalRequestSort(key);
    } else {
      // Otherwise use internal state
      setInternalSortConfig({ key, direction });
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const updatePaymentStatus = (payment: Payment) => {
    const today = new Date();
    const dueDate = parseISO(payment.due_date);
    const sevenDaysFromNow = addDays(today, 7);

    // If payment is cancelled, don't change status
    if (payment.status === "cancelled") {
      return payment;
    }

    // 1. If due date has passed, status is overdue
    if (isBefore(dueDate, today)) {
      return { ...payment, status: "overdue" };
    }

    // 2. If due date is within next 7 days, status is near_overdue
    if (isBefore(dueDate, sevenDaysFromNow)) {
      return { ...payment, status: "near_overdue" };
    }

    // 3. If due date is more than 7 days away, status is paid
    return { ...payment, status: "paid" };
  };

  const getDaysDifference = (dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    return Math.abs(Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const sortedPayments = React.useMemo(() => {
    if (!sortConfig) {
      // Default sort by days relative to due date
      return [...payments].sort((a, b) => {
        const now = new Date();
        const aDate = new Date(a.due_date);
        const bDate = new Date(b.due_date);

        // Calculate days to/from due date (negative for overdue, positive for upcoming)
        const aDaysDiff = Math.floor((aDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const bDaysDiff = Math.floor((bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Sort by days difference (overdue payments first, sorted by most days overdue)
        return aDaysDiff - bDaysDiff;
      });
    }

    return [...payments].sort((a, b) => {
      // Special case for status sorting - sort primarily by days relative to due date
      if (sortConfig.key === "status") {
        const now = new Date();
        const aDate = new Date(a.due_date);
        const bDate = new Date(b.due_date);

        // Calculate days to/from due date (negative for overdue, positive for upcoming)
        const aDaysDiff = Math.floor((aDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const bDaysDiff = Math.floor((bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // For ascending sort: overdue payments first (sorted by most days overdue),
        // then upcoming payments (sorted by closest due date)
        // For descending sort: reverse the order
        if (sortConfig.direction === "asc") {
          return aDaysDiff - bDaysDiff;
        } else {
          return bDaysDiff - aDaysDiff;
        }
      }

      // For other columns, use standard sorting
      let aValue: any = a[sortConfig.key as keyof Payment];
      let bValue: any = b[sortConfig.key as keyof Payment];

      // Handle member name sorting
      if (sortConfig.key === "member") {
        aValue = `${a.member.first_name} ${a.member.last_name}`;
        bValue = `${b.member.first_name} ${b.member.last_name}`;
      }

      // Special case for due_date sorting to maintain overdue payments sorted by days overdue
      if (sortConfig.key === "due_date") {
        const now = new Date();
        const aDate = new Date(a.due_date);
        const bDate = new Date(b.due_date);

        // Determine effective status
        const getEffectiveStatus = (status: string, dueDate: Date) => {
          if (status === "paid") return "paid";
          if (status === "cancelled") return "cancelled";

          // If due date has passed, status is overdue
          if (isAfter(now, dueDate)) {
            return "overdue";
          }

          // If due date is within 7 days, status is near_overdue
          const nearFutureDate = addDays(now, 7);
          if (isBefore(dueDate, nearFutureDate)) {
            return "near_overdue";
          }

          // Otherwise, status is pending
          return "pending";
        };

        const aStatus = getEffectiveStatus(a.status, aDate);
        const bStatus = getEffectiveStatus(b.status, bDate);

        // If both are overdue, sort by days overdue (greatest first)
        if (aStatus === "overdue" && bStatus === "overdue") {
          const aDays = getDaysDifference(a.due_date);
          const bDays = getDaysDifference(b.due_date);

          // If sorting ascending, smaller days overdue first
          // If sorting descending, greater days overdue first
          return sortConfig.direction === "asc"
            ? aDays - bDays
            : bDays - aDays;
        }

        // For non-overdue payments, use standard date sorting
        aValue = aDate.getTime();
        bValue = bDate.getTime();
      }
      // Handle other date sorting
      else if (sortConfig.key === "payment_date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [payments, sortConfig]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "near_overdue":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Payé";
      case "pending":
        return "En Attente";
      case "overdue":
        return "En Retard";
      case "near_overdue":
        return "Échéance Proche";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort("member")}
            >
              <div className="flex items-center">
                Membre
                {getSortIcon("member")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort("amount")}
            >
              <div className="flex items-center">
                Montant
                {getSortIcon("amount")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort("payment_date")}
            >
              <div className="flex items-center">
                Date de paiement
                {getSortIcon("payment_date")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort("due_date")}
            >
              <div className="flex items-center">
                Date d'échéance
                {getSortIcon("due_date")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort("status")}
            >
              <div className="flex items-center">
                Statut
                {getSortIcon("status")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => requestSort("payment_method")}
            >
              <div className="flex items-center">
                Mode de paiement
                {getSortIcon("payment_method")}
              </div>
            </TableHead>
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
          ) : sortedPayments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Aucun paiement trouvé
              </TableCell>
            </TableRow>
          ) : (
            sortedPayments.map((payment) => {
              const updatedPayment = updatePaymentStatus(payment);
              return (
                <TableRow key={payment.id}>
                  <TableCell
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/members/${payment.member_id}`)}
                  >
                    {`${payment.member.first_name} ${payment.member.last_name}`}
                  </TableCell>
                  <TableCell>{payment.amount.toFixed(2)} MAD</TableCell>
                  <TableCell>
                    {format(new Date(payment.payment_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.due_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          updatedPayment.status
                        )}`}
                      >
                        {getStatusText(updatedPayment.status)}
                      </span>
                      {(updatedPayment.status === "overdue" ||
                        updatedPayment.status === "near_overdue") &&
                        getDaysDifference(payment.due_date) > 0 && (
                          <span
                            className={`
                          inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${
                            updatedPayment.status === "overdue"
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
                    {payment.payment_method === "cash"
                      ? "Espèces"
                      : payment.payment_method === "credit_card"
                      ? "Carte bancaire"
                      : payment.payment_method === "bank_transfer"
                      ? "Virement bancaire"
                      : payment.payment_method.replace("_", " ")}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-500">
          Page {currentPage} sur {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;
