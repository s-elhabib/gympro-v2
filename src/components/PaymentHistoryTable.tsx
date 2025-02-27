import React from 'react';
import { format, isAfter } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from './ui/button';

interface Payment {
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
}

type SortConfig = {
  key: keyof Payment | 'member';
  direction: 'asc' | 'desc';
} | null;

const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  currentPage,
  totalPages,
  onPageChange,
  isLoading
}) => {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

  const requestSort = (key: keyof Payment | 'member') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const sortedPayments = React.useMemo(() => {
    if (!sortConfig) return payments;

    return [...payments].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Payment];
      let bValue: any = b[sortConfig.key as keyof Payment];

      // Handle member name sorting
      if (sortConfig.key === 'member') {
        aValue = `${a.member.first_name} ${a.member.last_name}`;
        bValue = `${b.member.first_name} ${b.member.last_name}`;
      }

      // Handle date sorting
      if (sortConfig.key === 'due_date' || sortConfig.key === 'payment_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [payments, sortConfig]);

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'pending' && isAfter(new Date(), new Date(dueDate))) {
      return 'bg-red-100 text-red-800';
    }
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('member')}
            >
              <div className="flex items-center">
                Member
                {getSortIcon('member')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('amount')}
            >
              <div className="flex items-center">
                Amount
                {getSortIcon('amount')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('due_date')}
            >
              <div className="flex items-center">
                Due Date
                {getSortIcon('due_date')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('payment_date')}
            >
              <div className="flex items-center">
                Payment Date
                {getSortIcon('payment_date')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('status')}
            >
              <div className="flex items-center">
                Status
                {getSortIcon('status')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('payment_method')}
            >
              <div className="flex items-center">
                Payment Method
                {getSortIcon('payment_method')}
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
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            sortedPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell 
                  className="cursor-pointer hover:text-blue-600"
                  onClick={() => navigate(`/members/${payment.member_id}`)}
                >
                  {`${payment.member.first_name} ${payment.member.last_name}`}
                </TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    getStatusColor(payment.status, payment.due_date)
                  }`}>
                    {isAfter(new Date(), new Date(payment.due_date)) && payment.status === 'pending'
                      ? 'overdue'
                      : payment.status}
                  </span>
                </TableCell>
                <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;