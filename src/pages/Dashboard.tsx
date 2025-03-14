import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Search,
  Lock,
  AlertCircle
} from 'lucide-react';
import { format, subMonths, subDays, differenceInDays, subYears, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import RevenueChart from '../components/RevenueChart';
import PaymentHistoryTable from '../components/PaymentHistoryTable';
import StatCard from '../components/StatCard';
import { TimeRange } from '../components/TimeRangeFilter';
import { searchByFullName } from '../lib/utils';

const ITEMS_PER_PAGE = 25;

const getTimeRangeDate = (range: TimeRange): { start: Date; end: Date } => {
  const now = new Date();
  const end = now;

  switch (range) {
    case '24h':
      return { start: subDays(now, 1), end };
    case '7d':
      return { start: subDays(now, 7), end };
    case '30d':
      return { start: subDays(now, 30), end };
    case '90d':
      return { start: subDays(now, 90), end };
    case '12m':
      return { start: subMonths(now, 12), end };
    case 'all':
      return { start: subYears(now, 10), end }; // Using 10 years as "all time"
    default:
      return { start: subDays(now, 7), end };
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'admin';
  const [revenueLoading, setRevenueLoading] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalRevenue: { value: 0, trend: 0, isPositive: true },
    activeMembers: { value: 0, trend: 0, isPositive: true },
    attendance: { value: 0, trend: 0, isPositive: true },
    newSignups: { value: 0, trend: 0, isPositive: true }
  });
  const [revenueData, setRevenueData] = React.useState({
    labels: [],
    datasets: [{
      label: 'Revenu',
      data: [],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });
  const [allPayments, setAllPayments] = React.useState<any[]>([]);
  const [displayedPayments, setDisplayedPayments] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all payments with member details
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          member:members(first_name, last_name)
        `)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      if (paymentsData) {
        // Update payment status based on due date
        const now = new Date();
        const updatedPayments = paymentsData.map(payment => {
          const dueDate = parseISO(payment.due_date);
          const nearFutureDate = addDays(now, 7);

          if (payment.status === 'paid') {
            return payment;
          } else if (isBefore(dueDate, now)) {
            return { ...payment, status: 'overdue' };
          } else if (isBefore(dueDate, nearFutureDate)) {
            return { ...payment, status: 'due-soon' };
          } else {
            return { ...payment, status: 'pending' };
          }
        });

        // Sort payments by status priority and due date
        const sortedPayments = updatedPayments.sort((a, b) => {
          const statusPriority = {
            'overdue': 1,
            'due-soon': 2,
            'pending': 3,
            'paid': 4
          };

          const priorityA = statusPriority[a.status as keyof typeof statusPriority];
          const priorityB = statusPriority[b.status as keyof typeof statusPriority];

          if (priorityA === priorityB) {
            return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
          }
          return priorityA - priorityB;
        });

        setAllPayments(sortedPayments);
        setTotalRecords(sortedPayments.length);

        // Calculate total revenue and trend
        const totalRevenue = sortedPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);

        const lastMonthRevenue = sortedPayments
          .filter(p => {
            const date = new Date(p.payment_date);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return date >= lastMonth && p.status === 'paid';
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const previousMonthRevenue = sortedPayments
          .filter(p => {
            const date = new Date(p.payment_date);
            const twoMonthsAgo = new Date();
            twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return date >= twoMonthsAgo && date < lastMonth && p.status === 'paid';
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const revenueTrend = previousMonthRevenue === 0 ? 100 :
          ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

        // Prepare revenue chart data
        const last12Months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          return format(date, 'MMM yyyy');
        });

        const monthlyRevenue = last12Months.map(month => {
          return sortedPayments
            .filter(p => {
              const paymentMonth = format(new Date(p.payment_date), 'MMM yyyy');
              return paymentMonth === month && p.status === 'paid';
            })
            .reduce((sum, p) => sum + p.amount, 0);
        });

        setRevenueData({
          labels: last12Months,
          datasets: [{
            label: 'Revenu',
            data: monthlyRevenue,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true
          }]
        });

        // Fetch members stats
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('created_at, status');

        if (membersError) throw membersError;

        if (members) {
          const activeMembers = members.filter(m => m.status === 'active').length;
          const lastMonthMembers = members.filter(m => {
            const date = new Date(m.created_at);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return date >= lastMonth;
          }).length;

          const membersTrend = ((lastMonthMembers / activeMembers) * 100);

          // Fetch attendance stats
          const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('created_at')
            .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

          if (attendanceError) throw attendanceError;

          const todayAttendance = attendance?.length || 0;
          const yesterdayStart = new Date(new Date().setDate(new Date().getDate() - 1));
          yesterdayStart.setHours(0,0,0,0);
          const yesterdayEnd = new Date(new Date().setDate(new Date().getDate() - 1));
          yesterdayEnd.setHours(23,59,59,999);

          const { data: yesterdayAttendance, error: yesterdayError } = await supabase
            .from('attendance')
            .select('created_at')
            .gte('created_at', yesterdayStart.toISOString())
            .lte('created_at', yesterdayEnd.toISOString());

          if (yesterdayError) throw yesterdayError;

          const attendanceTrend = yesterdayAttendance?.length === 0 ? 100 :
            ((todayAttendance - yesterdayAttendance.length) / yesterdayAttendance.length) * 100;

          setStats({
            totalRevenue: { value: totalRevenue, trend: revenueTrend, isPositive: revenueTrend > 0 },
            activeMembers: { value: activeMembers, trend: membersTrend, isPositive: membersTrend > 0 },
            attendance: { value: todayAttendance, trend: attendanceTrend, isPositive: attendanceTrend > 0 },
            newSignups: { value: lastMonthMembers, trend: membersTrend, isPositive: membersTrend > 0 }
          });
        }

        // Update displayed payments based on current page and search
        updateDisplayedPayments(sortedPayments, searchTerm, currentPage);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      addNotification({
        title: 'Erreur',
        message: 'Échec du chargement des données du tableau de bord. Veuillez réessayer.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayedPayments = (payments: any[], search: string, page: number) => {
    const filtered = payments.filter(payment =>
      searchByFullName(search, payment.member.first_name, payment.member.last_name)
    );

    setTotalRecords(filtered.length);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setDisplayedPayments(filtered.slice(start, end));

    // If current page is beyond available pages, reset to first page
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (page > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  React.useEffect(() => {
    updateDisplayedPayments(allPayments, searchTerm, currentPage);
  }, [searchTerm, currentPage]);

  const handleTimeRangeChange = async (range: TimeRange) => {
    try {
      setRevenueLoading(true);
      setError(null);
      const { start, end } = getTimeRangeDate(range);
      
      // Calculate the same period length for the previous period
      const periodLength = differenceInDays(end, start);
      const previousStart = subDays(start, periodLength);
      const previousEnd = subDays(end, periodLength);

      // Fetch current period revenue
      const { data: currentPeriodData, error: currentError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', start.toISOString())
        .lte('payment_date', end.toISOString());

      if (currentError) throw currentError;

      // Fetch previous period revenue
      const { data: previousPeriodData, error: previousError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', previousStart.toISOString())
        .lte('payment_date', previousEnd.toISOString());

      if (previousError) throw previousError;

      // Calculate totals
      const currentRevenue = currentPeriodData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const previousRevenue = previousPeriodData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Calculate trend
      const revenueTrend = previousRevenue === 0 
        ? 100 
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      // Update stats
      setStats(prev => ({
        ...prev,
        totalRevenue: {
          value: currentRevenue,
          trend: revenueTrend,
          isPositive: revenueTrend >= 0
        }
      }));

    } catch (error: any) {
      console.error('Error updating revenue:', error);
      addNotification({
        title: 'Erreur',
        message: 'Échec de la mise à jour des données de revenus. Veuillez réessayer.',
        type: 'error'
      });
    } finally {
      setRevenueLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <div className="bg-red-100 text-red-600 p-4 rounded-full mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Échec du chargement du tableau de bord</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Un aperçu des performances de votre salle de sport</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          icon={DollarSign}
          label="Revenu Total"
          value={stats.totalRevenue.value}
          trend={stats.totalRevenue.trend}
          isPositive={stats.totalRevenue.isPositive}
          format="currency"
          showTimeRangeFilter={true}
          onTimeRangeChange={handleTimeRangeChange}
          isLocked={!isAdmin}
          isLoading={revenueLoading}
        />
        <StatCard 
          icon={Users}
          label="Membres Actifs"
          value={stats.activeMembers.value}
          trend={stats.activeMembers.trend}
          isPositive={stats.activeMembers.isPositive}
        />
        <StatCard 
          icon={Activity}
          label="Présence du Jour"
          value={stats.attendance.value}
          trend={stats.attendance.trend}
          isPositive={stats.attendance.isPositive}
        />
        <StatCard 
          icon={TrendingUp}
          label="Nouvelles Inscriptions"
          value={stats.newSignups.value}
          trend={stats.newSignups.trend}
          isPositive={stats.newSignups.isPositive}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Historique des Paiements</h2>
            <p className="text-sm text-gray-500">Aperçu de tous les paiements des membres</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher des paiements..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full sm:max-w-sm"
            />
          </div>
        </div>

        <PaymentHistoryTable
          payments={displayedPayments}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      <RevenueChart data={revenueData} />
    </div>
  );
};



export default Dashboard;