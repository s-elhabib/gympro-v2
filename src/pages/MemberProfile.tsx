import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  User,
  Calendar,
  Clock,
  CreditCard,
  Edit,
  ArrowLeft,
  ChevronDown,
  Dumbbell,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from '../components/ui/button';
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
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import { toast } from 'sonner';
import MemberForm from '../components/MemberForm';
import { MemberFormValues } from '../lib/validations/member';

type TimeRange = 'week' | 'month' | 'year';

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [member, setMember] = React.useState<any>(null);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState<TimeRange>('week');
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [attendanceStats, setAttendanceStats] = React.useState({
    totalVisits: 0,
    avgDuration: 0,
    mostFrequentType: '',
  });

  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
          label: 'This Week'
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month'
        };
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
          label: 'This Year'
        };
    }
  };

  const fetchAttendanceStats = async (range: TimeRange) => {
    try {
      const dateRange = getDateRange(range);
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', id)
        .gte('check_in_time', dateRange.start.toISOString())
        .lte('check_in_time', dateRange.end.toISOString())
        .order('check_in_time', { ascending: false });

      if (attendanceError) throw attendanceError;

      setAttendance(attendanceData || []);

      // Calculate attendance stats
      if (attendanceData) {
        const totalVisits = attendanceData.length;
        const completedVisits = attendanceData.filter(a => a.check_out_time);
        const totalDuration = completedVisits.reduce((sum, a) => {
          const duration = new Date(a.check_out_time).getTime() - new Date(a.check_in_time).getTime();
          return sum + duration;
        }, 0);
        const avgDuration = completedVisits.length ? totalDuration / completedVisits.length : 0;
        
        const typeCounts = attendanceData.reduce((acc: any, curr) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        }, {});
        
        const mostFrequentType = Object.entries(typeCounts).length > 0
          ? Object.entries(typeCounts).reduce((a, b) => (b[1] as number) > (a[1] as number) ? b : a)[0]
          : '';

        setAttendanceStats({
          totalVisits,
          avgDuration: avgDuration / (1000 * 60),
          mostFrequentType,
        });
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load attendance statistics',
        type: 'error'
      });
    }
  };

  const fetchMemberData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!id) {
        throw new Error('Member ID is required');
      }

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (memberError) throw memberError;
      if (!memberData) throw new Error('Member not found');

      setMember(memberData);

      // Fetch attendance stats for initial time range
      await fetchAttendanceStats(timeRange);

      // Fetch payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', id)
        .order('payment_date', { ascending: false });

      if (paymentError) throw paymentError;
      setPayments(paymentData || []);

    } catch (error: any) {
      console.error('Error fetching member data:', error);
      setError(error.message);
      addNotification({
        title: 'Error',
        message: error.message || 'Failed to load member data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMemberData();
  }, [id]);

  // Update attendance stats when time range changes
  React.useEffect(() => {
    if (id) {
      fetchAttendanceStats(timeRange);
    }
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string, dueDate: string) => {
    if (status === 'pending' && new Date() > new Date(dueDate)) {
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

  const handleUpdateMember = async (data: MemberFormValues) => {
    try {
      if (!id) {
        throw new Error('Member ID is required');
      }

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
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Close the dialog
      setIsEditDialogOpen(false);
      
      // Refresh member data
      await fetchMemberData();
      
      toast.success("Member information updated successfully");
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error(error.message || 'Failed to update member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="bg-red-50 text-red-600 rounded-full p-3 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">
          {error || 'Member not found'}
        </h1>
        <p className="text-gray-500 mb-6">
          Please check the member ID and try again
        </p>
        <Button onClick={() => navigate('/members')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/members')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>
                Update member information below.
              </DialogDescription>
            </DialogHeader>
            <MemberForm
              defaultValues={{
                firstName: member.first_name,
                lastName: member.last_name,
                email: member.email,
                phone: member.phone,
                membershipType: member.membership_type,
                startDate: new Date(member.start_date),
                status: member.status,
                notes: member.notes || ''
              }}
              onSubmit={handleUpdateMember}
              isEditing
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Member Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{`${member.first_name} ${member.last_name}`}</h1>
              <span className={`inline-block px-2 py-1 rounded-full text-xs capitalize mt-1 ${
                getStatusColor(member.status)
              }`}>
                {member.status}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-gray-900">{member.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <p className="text-gray-900">{member.phone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Membership Type</label>
              <p className="text-gray-900 capitalize">{member.membership_type}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Member Since</label>
              <p className="text-gray-900">{format(new Date(member.start_date), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Attendance Stats Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Attendance Overview</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {getDateRange(timeRange).label}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTimeRange('week')}>
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange('month')}>
                  This Month
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange('year')}>
                  This Year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Total Visits</span>
                </div>
                <p className="text-2xl font-semibold">{attendanceStats.totalVisits}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Avg. Duration</span>
                </div>
                <p className="text-2xl font-semibold">
                  {Math.round(attendanceStats.avgDuration)} min
                </p>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-purple-600 mb-2">
                <Dumbbell className="h-5 w-5" />
                <span className="font-medium">Most Common Activity</span>
              </div>
              <p className="text-2xl font-semibold capitalize">
                {attendanceStats.mostFrequentType
                  ? attendanceStats.mostFrequentType.replace('_', ' ')
                  : 'No activities yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">Payment Summary</h2>
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">${payment.amount.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    getPaymentStatusColor(payment.status, payment.due_date)
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No payment records found
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Attendance History</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length > 0 ? (
              attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.check_in_time), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(record.check_in_time), 'h:mm a')}</TableCell>
                  <TableCell>
                    {record.check_out_time 
                      ? format(new Date(record.check_out_time), 'h:mm a')
                      : 'In Progress'
                    }
                  </TableCell>
                  <TableCell>
                    {record.check_out_time
                      ? (() => {
                          const duration = (new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime()) / (1000 * 60);
                          const hours = Math.floor(duration / 60);
                          const minutes = Math.floor(duration % 60);
                          return `${hours}h ${minutes}m`;
                        })()
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="capitalize">{record.type.replace('_', ' ')}</TableCell>
                  <TableCell>{record.notes || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No attendance records found for the selected period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Payment History</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(payment.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      getPaymentStatusColor(payment.status, payment.due_date)
                    }`}>
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                  <TableCell>{payment.notes || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No payment records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MemberProfile;