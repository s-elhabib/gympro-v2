import React from "react";
import { useNavigate } from "react-router-dom";
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
  AlertCircle,
} from "lucide-react";
import {
  format,
  subMonths,
  subDays,
  differenceInDays,
  subYears,
  parseISO,
  isAfter,
  isBefore,
  addDays,
} from "date-fns";
import { Button } from "../components/ui/button";
import { SortConfig, Payment } from "../components/PaymentHistoryTable";
import { Input } from "../components/ui/input";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import RevenueChart from "../components/RevenueChart";
import PaymentHistoryTable from "../components/PaymentHistoryTable";
import StatCard from "../components/StatCard";
import { TimeRange } from "../components/TimeRangeFilter";
import { searchByFullName } from "../lib/utils";

const ITEMS_PER_PAGE = 25;

const getTimeRangeDate = (range: TimeRange): { start: Date; end: Date } => {
  const now = new Date();
  const end = now;

  switch (range) {
    case "24h":
      return { start: subDays(now, 1), end };
    case "7d":
      return { start: subDays(now, 7), end };
    case "30d":
      return { start: subDays(now, 30), end };
    case "90d":
      return { start: subDays(now, 90), end };
    case "12m":
      return { start: subMonths(now, 12), end };
    case "all":
      return { start: subYears(now, 10), end }; // Using 10 years as "all time"
    default:
      return { start: subDays(now, 7), end };
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [revenueLoading, setRevenueLoading] = React.useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<TimeRange>("7d");
  const [stats, setStats] = React.useState({
    totalRevenue: { value: 0, trend: 0, isPositive: true },
    activeMembers: { value: 0, trend: 0, isPositive: true },
    attendance: { value: 0, trend: 0, isPositive: true },
    newSignups: { value: 0, trend: 0, isPositive: true },
  });
  const [revenueData, setRevenueData] = React.useState({
    labels: [],
    datasets: [
      {
        label: "Revenu",
        data: [],
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  });
  const [allPayments, setAllPayments] = React.useState<any[]>([]);
  const [displayedPayments, setDisplayedPayments] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Helper function to calculate days difference for overdue payments
  const getDaysDifference = (dueDate: string): number => {
    const today = new Date();
    const due = parseISO(dueDate);
    return Math.abs(Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all payments with member details
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          *,
          member:members!payments_member_id_fkey(first_name, last_name)
        `
        );
      // Don't order by payment_date initially, we'll sort after updating statuses
      if (paymentsError) throw paymentsError;

      if (paymentsData) {
        // Update payment status based on due date
        const now = new Date();
        const updatedPayments = paymentsData.map((payment) => {
          const dueDate = parseISO(payment.due_date);
          const nearFutureDate = addDays(now, 7);

          if (payment.status === "paid") {
            return payment;
          } else if (isBefore(dueDate, now)) {
            return { ...payment, status: "overdue" };
          } else if (isBefore(dueDate, nearFutureDate)) {
            return { ...payment, status: "due-soon" };
          } else {
            return { ...payment, status: "pending" };
          }
        });

        // Group payments by member_id and find the most recent payment for each member
        const memberLatestPayments = new Map();

        updatedPayments.forEach(payment => {
          const memberId = payment.member_id;
          const paymentDate = new Date(payment.payment_date);

          if (!memberLatestPayments.has(memberId) ||
              paymentDate > new Date(memberLatestPayments.get(memberId).payment_date)) {
            memberLatestPayments.set(memberId, payment);
          }
        });

        // Convert the Map to an array of the most recent payments
        const latestPayments = Array.from(memberLatestPayments.values());

        // Filtrer les paiements pour n'afficher que ceux qui sont proches de l'échéance ou en retard
        const filteredPayments = latestPayments.filter(payment => {
          const now = new Date();
          const dueDate = parseISO(payment.due_date);
          const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Afficher uniquement les paiements :
          // - en retard (daysDiff < 0)
          // - dus dans les 7 prochains jours (0 <= daysDiff <= 7)
          return daysDiff <= 7;
        });

        // Trier les paiements filtrés par date d'échéance
        const sortedPayments = filteredPayments.sort((a, b) => {
          const now = new Date();
          const aDate = parseISO(a.due_date);
          const bDate = parseISO(b.due_date);

          // Calculate days to/from due date (negative for overdue, positive for upcoming)
          const aDaysDiff = Math.floor((aDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const bDaysDiff = Math.floor((bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Sort by days difference (overdue payments first, sorted by most days overdue)
          return aDaysDiff - bDaysDiff;
        });

        // Log the sorted payments for debugging
        console.log(
          "Sorted payments:",
          sortedPayments.map((p) => ({
            member: `${p.member.first_name} ${p.member.last_name}`,
            status: p.status,
            due_date: p.due_date,
          }))
        );

        // Store the filtered and sorted payments
        setAllPayments(sortedPayments);
        setTotalRecords(sortedPayments.length);

        // Calculate total revenue based on selected time range
        const timeRange = getTimeRangeDate(selectedTimeRange);
        const totalRevenue = sortedPayments
          .filter((p) => {
            const paymentDate = new Date(p.payment_date);
            return p.status === "paid" &&
                   isAfter(paymentDate, timeRange.start) &&
                   isBefore(paymentDate, timeRange.end);
          })
          .reduce((sum, p) => sum + p.amount, 0);

        // Calculate last period revenue for trend
        const periodLength = differenceInDays(timeRange.end, timeRange.start);
        const previousPeriodStart = subDays(timeRange.start, periodLength);
        const previousPeriodEnd = timeRange.start;

        const previousPeriodRevenue = sortedPayments
          .filter((p) => {
            const paymentDate = new Date(p.payment_date);
            return p.status === "paid" &&
                   isAfter(paymentDate, previousPeriodStart) &&
                   isBefore(paymentDate, previousPeriodEnd);
          })
          .reduce((sum, p) => sum + p.amount, 0);

        // Calculer le revenu du mois dernier
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

        const lastMonthRevenue = sortedPayments
          .filter((p) => {
            const date = new Date(p.payment_date);
            return (
              date >= startOfLastMonth &&
              date <= endOfLastMonth &&
              p.status === "paid"
            );
          })
          .reduce((sum, p) => sum + p.amount, 0);

        // Calculer le revenu du mois précédent
        const twoMonthsAgo = new Date(lastMonth);
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);
        const startOfTwoMonthsAgo = new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1);
        const endOfTwoMonthsAgo = new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 0);

        const previousMonthRevenue = sortedPayments
          .filter((p) => {
            const date = new Date(p.payment_date);
            return (
              date >= startOfTwoMonthsAgo &&
              date <= endOfTwoMonthsAgo &&
              p.status === "paid"
            );
          })
          .reduce((sum, p) => sum + p.amount, 0);

        const revenueTrend =
          previousMonthRevenue === 0
            ? 100
            : ((lastMonthRevenue - previousMonthRevenue) /
                previousMonthRevenue) *
              100;

        // Prepare revenue chart data
        const last12Months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          return format(date, "MMM yyyy");
        });

        const monthlyRevenue = last12Months.map((month) => {
          return sortedPayments
            .filter((p) => {
              const paymentMonth = format(new Date(p.payment_date), "MMM yyyy");
              return paymentMonth === month && p.status === "paid";
            })
            .reduce((sum, p) => sum + p.amount, 0);
        });

        setRevenueData({
          labels: last12Months,
          datasets: [
            {
              label: "Revenu",
              data: monthlyRevenue,
              borderColor: "rgb(99, 102, 241)",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        });

        // Fetch members stats
        const { data: members, error: membersError } = await supabase
          .from("members")
          .select("created_at, status");

        if (membersError) throw membersError;

        if (members) {
          const activeMembers = members.filter(
            (m) => m.status === "active"
          ).length;
          const lastMonthMembers = members.filter((m) => {
            const date = new Date(m.created_at);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return date >= lastMonth;
          }).length;

          const membersTrend = (lastMonthMembers / activeMembers) * 100;

          // Fetch attendance stats
          const { data: attendance, error: attendanceError } = await supabase
            .from("attendance")
            .select("created_at")
            .gte(
              "created_at",
              new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
            );

          if (attendanceError) throw attendanceError;

          const todayAttendance = attendance?.length || 0;
          const yesterdayStart = new Date(
            new Date().setDate(new Date().getDate() - 1)
          );
          yesterdayStart.setHours(0, 0, 0, 0);
          const yesterdayEnd = new Date(
            new Date().setDate(new Date().getDate() - 1)
          );
          yesterdayEnd.setHours(23, 59, 59, 999);

          const { data: yesterdayAttendance, error: yesterdayError } =
            await supabase
              .from("attendance")
              .select("created_at")
              .gte("created_at", yesterdayStart.toISOString())
              .lte("created_at", yesterdayEnd.toISOString());

          if (yesterdayError) throw yesterdayError;

          const attendanceTrend =
            yesterdayAttendance?.length === 0
              ? 100
              : ((todayAttendance - yesterdayAttendance.length) /
                  yesterdayAttendance.length) *
                100;

          setStats({
            totalRevenue: {
              value: totalRevenue,
              trend: revenueTrend,
              isPositive: revenueTrend > 0,
            },
            activeMembers: {
              value: activeMembers,
              trend: membersTrend,
              isPositive: membersTrend > 0,
            },
            attendance: {
              value: todayAttendance,
              trend: attendanceTrend,
              isPositive: attendanceTrend > 0,
            },
            newSignups: {
              value: lastMonthMembers,
              trend: membersTrend,
              isPositive: membersTrend > 0,
            },
          });
        }

        // Update displayed payments based on current page and search
        updateDisplayedPayments(sortedPayments, searchTerm, currentPage);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
      addNotification({
        title: "Erreur",
        message:
          "Échec du chargement des données du tableau de bord. Veuillez réessayer.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayedPayments = (
    payments: any[],
    search: string,
    page: number
  ) => {
    const filtered = payments.filter((payment) =>
      searchByFullName(
        search,
        payment.member.first_name,
        payment.member.last_name
      )
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

  // Handle sorting request from PaymentHistoryTable
  const handleRequestSort = (key: keyof Payment | "member") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    // Re-sort all payments based on the new sort config
    const sortedPayments = sortPaymentsByConfig(allPayments, { key, direction });
    setAllPayments(sortedPayments);

    // Update displayed payments with the new sort
    updateDisplayedPayments(sortedPayments, searchTerm, currentPage);
  };

  // Function to sort payments based on sort config
  const sortPaymentsByConfig = (payments: any[], config: SortConfig) => {
    if (!config) {
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
      if (config.key === "status") {
        const now = new Date();
        const aDate = new Date(a.due_date);
        const bDate = new Date(b.due_date);

        // Calculate days to/from due date (negative for overdue, positive for upcoming)
        const aDaysDiff = Math.floor((aDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const bDaysDiff = Math.floor((bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // For ascending sort: overdue payments first (sorted by most days overdue),
        // then upcoming payments (sorted by closest due date)
        // For descending sort: reverse the order
        if (config.direction === "asc") {
          return aDaysDiff - bDaysDiff;
        } else {
          return bDaysDiff - aDaysDiff;
        }
      }

      // For other columns, use standard sorting
      let aValue: any = a[config.key as keyof Payment];
      let bValue: any = b[config.key as keyof Payment];

      // Handle member name sorting
      if (config.key === "member") {
        aValue = `${a.member.first_name} ${a.member.last_name}`;
        bValue = `${b.member.first_name} ${b.member.last_name}`;
      }

      // Special case for due_date sorting to maintain overdue payments sorted by days overdue
      if (config.key === "due_date") {
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
          return config.direction === "asc"
            ? aDays - bDays
            : bDays - aDays;
        }

        // For non-overdue payments, use standard date sorting
        aValue = aDate.getTime();
        bValue = bDate.getTime();
      }
      // Handle other date sorting
      else if (config.key === "payment_date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return config.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  React.useEffect(() => {
    if (user) {
      fetchDashboardData();
      // Only load revenue data when component mounts, not on selectedTimeRange changes
      if (selectedTimeRange === "7d") {
        handleTimeRangeChange('30d');
      }
    }
  }, [user]);

  React.useEffect(() => {
    // If sort config changes, re-sort all payments
    if (sortConfig) {
      const sortedPayments = sortPaymentsByConfig(allPayments, sortConfig);
      updateDisplayedPayments(sortedPayments, searchTerm, currentPage);
    } else {
      updateDisplayedPayments(allPayments, searchTerm, currentPage);
    }
  }, [searchTerm, currentPage, sortConfig]);

  const handleTimeRangeChange = async (range: TimeRange) => {
    try {
      setRevenueLoading(true);
      setError(null);
      setSelectedTimeRange(range);
      const { start, end } = getTimeRangeDate(range);

      // Calculate the same period length for the previous period
      const periodLength = differenceInDays(end, start);
      const previousStart = subDays(start, periodLength);
      const previousEnd = subDays(end, periodLength);

      // Fetch current period revenue - get all payments, not just filtered ones
      const { data: currentPeriodData, error: currentError } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "paid")
        .gte("payment_date", start.toISOString())
        .lte("payment_date", end.toISOString());

      if (currentError) throw currentError;

      // Fetch previous period revenue
      const { data: previousPeriodData, error: previousError } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "paid")
        .gte("payment_date", previousStart.toISOString())
        .lte("payment_date", previousEnd.toISOString());

      if (previousError) throw previousError;

      // Calculate totals
      const currentRevenue =
        currentPeriodData?.reduce((sum, payment) => sum + payment.amount, 0) ||
        0;
      const previousRevenue =
        previousPeriodData?.reduce((sum, payment) => sum + payment.amount, 0) ||
        0;

      // Calculate trend
      const revenueTrend =
        previousRevenue === 0
          ? 100
          : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalRevenue: {
          value: currentRevenue,
          trend: revenueTrend,
          isPositive: revenueTrend >= 0,
        },
      }));
    } catch (error: any) {
      console.error("Error updating revenue:", error);
      addNotification({
        title: "Erreur",
        message:
          "Échec de la mise à jour des données de revenus. Veuillez réessayer.",
        type: "error",
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Échec du chargement du tableau de bord
        </h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Un aperçu des performances de votre salle de sport
          </p>
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
          isLoading={revenueLoading}
        />
        <StatCard
          icon={Users}
          label="Membres Actifs"
          value={stats.activeMembers.value}
          trend={stats.activeMembers.trend}
          isPositive={stats.activeMembers.isPositive}
          clickable={true}
          onClick={() => navigate('/members')}
        />
        <StatCard
          icon={Activity}
          label="Présence du Jour"
          value={stats.attendance.value}
          trend={stats.attendance.trend}
          isPositive={stats.attendance.isPositive}
          clickable={true}
          onClick={() => navigate('/attendance')}
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
            <h2 className="text-lg font-semibold text-gray-900">
              Historique des Paiements
            </h2>
            <p className="text-sm text-gray-500">
              Aperçu de tous les paiements des membres
            </p>
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
          sortConfig={sortConfig}
          onRequestSort={handleRequestSort}
        />
      </div>

      <RevenueChart data={revenueData} />
    </div>
  );
};

export default Dashboard;
