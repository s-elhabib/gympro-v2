import { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { supabase } from '../lib/supabase';

export function useReportsData(reportType: string = 'monthly') {
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<{
    weeklyData: any[];
    hourlyData: any[];
  }>({ weeklyData: [], hourlyData: [] });
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    activeMembers: 0,
    newSignups: 0,
    avgRevenuePerMember: 0,
  });
  const [monthlyComparison, setMonthlyComparison] = useState({
    revenue: { current: 0, previous: 0 },
    members: { current: 0, previous: 0 },
    newMembers: { current: 0, previous: 0 },
    avgRevenue: { current: 0, previous: 0 },
  });

  // Calculate percentage change between two values
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Get date range based on report type
  const getDateRange = (type: string) => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    switch (type) {
      case 'daily':
        // Current day vs previous day
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'weekly':
        // Current week vs previous week
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
        currentStart = new Date(now.getFullYear(), now.getMonth(), diff);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
        previousStart = new Date(now.getFullYear(), now.getMonth(), diff - 7);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), diff - 1, 23, 59, 59);
        break;
      case 'quarterly':
        // Current quarter vs previous quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        currentEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
        previousStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59);
        break;
      case 'yearly':
        // Current year vs previous year
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      case '30d':
        // Last 30 days (to match Dashboard default)
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        currentEnd = now;
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 31);
        break;
      case 'monthly':
      default:
        // Use last 30 days by default to match Dashboard
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        currentEnd = now;
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 31);
        break;
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  };

  // Fetch summary data
  const fetchSummaryData = async () => {
    try {
      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(reportType);

      // Current period revenue
      const { data: currentRevenue, error: currentRevenueError } = await supabase
        .from("payments")
        .select("amount, status")
        .gte("payment_date", currentStart.toISOString())
        .lte("payment_date", currentEnd.toISOString())
        .eq("status", "paid");

      if (currentRevenueError) throw currentRevenueError;

      // Previous period revenue
      const { data: previousRevenue, error: previousRevenueError } = await supabase
        .from("payments")
        .select("amount, status")
        .gte("payment_date", previousStart.toISOString())
        .lte("payment_date", previousEnd.toISOString())
        .eq("status", "paid");

      if (previousRevenueError) throw previousRevenueError;

      // Active members in current period
      const { data: currentActiveMembers, error: currentActiveMembersError } = await supabase
        .from("members")
        .select("id")
        .eq("status", "active");

      if (currentActiveMembersError) throw currentActiveMembersError;

      // Active members in previous period
      const { data: previousActiveMembers, error: previousActiveMembersError } = await supabase
        .from("members")
        .select("id")
        .eq("status", "active")
        .lt("created_at", currentStart.toISOString());

      if (previousActiveMembersError) throw previousActiveMembersError;

      // New signups in current period
      const { data: currentNewMembers, error: currentNewMembersError } = await supabase
        .from("members")
        .select("id")
        .gte("created_at", currentStart.toISOString())
        .lte("created_at", currentEnd.toISOString());

      if (currentNewMembersError) throw currentNewMembersError;

      // New signups in previous period
      const { data: previousNewMembers, error: previousNewMembersError } = await supabase
        .from("members")
        .select("id")
        .gte("created_at", previousStart.toISOString())
        .lte("created_at", previousEnd.toISOString());

      if (previousNewMembersError) throw previousNewMembersError;

      // Calculate totals with null checks
      const currentRevenueTotal =
        currentRevenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const previousRevenueTotal =
        previousRevenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const currentMembersCount = currentActiveMembers?.length || 0;
      const previousMembersCount = previousActiveMembers?.length || 0;
      const currentNewMembersCount = currentNewMembers?.length || 0;
      const previousNewMembersCount = previousNewMembers?.length || 0;

      // Update state
      setSummaryData({
        totalRevenue: currentRevenueTotal,
        activeMembers: currentMembersCount,
        newSignups: currentNewMembersCount,
        avgRevenuePerMember: currentMembersCount
          ? currentRevenueTotal / currentMembersCount
          : 0,
      });

      setMonthlyComparison({
        revenue: {
          current: currentRevenueTotal,
          previous: previousRevenueTotal,
        },
        members: {
          current: currentMembersCount,
          previous: previousMembersCount,
        },
        newMembers: {
          current: currentNewMembersCount,
          previous: previousNewMembersCount,
        },
        avgRevenue: {
          current: currentMembersCount
            ? currentRevenueTotal / currentMembersCount
            : 0,
          previous: previousMembersCount
            ? previousRevenueTotal / previousMembersCount
            : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching summary data:", error);
      // Set default values in case of error
      setSummaryData({
        totalRevenue: 0,
        activeMembers: 0,
        newSignups: 0,
        avgRevenuePerMember: 0,
      });
      setMonthlyComparison({
        revenue: { current: 0, previous: 0 },
        members: { current: 0, previous: 0 },
        newMembers: { current: 0, previous: 0 },
        avgRevenue: { current: 0, previous: 0 },
      });
    }
  };

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      let startDate, endDate, groupByFormat, labelFormat;
      const now = new Date();

      // Set date range and format based on report type
      switch (reportType) {
        case 'daily':
          // Last 7 days
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          groupByFormat = "EEE"; // Day of week (Mon, Tue, etc.)
          labelFormat = "EEE";
          break;
        case 'weekly':
          // Last 8 weeks
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (7 * 8));
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          groupByFormat = "'W'w"; // Week number (W1, W2, etc.)
          labelFormat = "'W'w";
          break;
        case 'quarterly':
          // Last 4 quarters
          startDate = new Date(now.getFullYear() - 1, Math.floor(now.getMonth() / 3) * 3, 1);
          endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 2, 31, 23, 59, 59);
          groupByFormat = "'Q'Q yyyy"; // Quarter (Q1 2023, Q2 2023, etc.)
          labelFormat = "'Q'Q";
          break;
        case 'yearly':
          // Last 5 years
          startDate = new Date(now.getFullYear() - 4, 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          groupByFormat = "yyyy"; // Year (2023, 2024, etc.)
          labelFormat = "yyyy";
          break;
        case 'monthly':
        default:
          // Last 6 months
          startDate = startOfMonth(subMonths(now, 5));
          endDate = endOfMonth(now);
          groupByFormat = "MMM"; // Month (Jan, Feb, etc.)
          labelFormat = "MMM";
          break;
      }

      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, payment_date, status")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString())
        .eq("status", "paid");

      if (error) throw error;

      if (!payments || payments.length === 0) {
        // If no data, return empty or placeholder data
        setRevenueData([]);
        return;
      }

      // Group payments by the appropriate time period
      const groupedRevenue = payments.reduce((acc: any, payment) => {
        const period = format(parseISO(payment.payment_date), groupByFormat);
        acc[period] = (acc[period] || 0) + payment.amount;
        return acc;
      }, {});

      // Create chart data
      const chartData = Object.entries(groupedRevenue).map(([period, revenue]) => ({
        month: period, // Keep 'month' as the key for consistency with chart components
        revenue: revenue as number,
      }));

      // Sort chronologically if needed
      if (reportType === 'monthly') {
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        chartData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
      } else {
        // For other report types, sort by the period string
        chartData.sort((a, b) => a.month.localeCompare(b.month));
      }

      setRevenueData(chartData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      // Set default empty data in case of error
      setRevenueData([]);
    }
  };

  // Fetch membership distribution
  const fetchMembershipData = async () => {
    try {
      // First, fetch all membership types from the database
      const { data: membershipTypesData, error: membershipTypesError } = await supabase
        .from("membership_types")
        .select("*");

      if (membershipTypesError) throw membershipTypesError;

      // Get the actual membership types from the database
      const validMembershipTypes = membershipTypesData?.map(type => type.type) || [];

      // Create a map for translating membership types to French
      const translateToFrench = (type: string): string => {
        switch (type) {
          case "monthly": return "Mensuel";
          case "quarterly": return "Trimestriel";
          case "annual": return "Annuel";
          case "day_pass": return "Accès Journalier";
          // If it's already in French, return as is
          case "Mensuel":
          case "Trimestriel":
          case "Annuel":
          case "Accès Journalier":
            return type;
          default: return type;
        }
      };

      // Fetch active members
      const { data: members, error } = await supabase
        .from("members")
        .select("membership_type")
        .eq("status", "active");

      if (error) throw error;

      if (!members || members.length === 0) {
        // If no data, return empty or placeholder data
        setMembershipData([]);
        return;
      }

      // Count membership types
      const distribution = members.reduce((acc: any, member) => {
        // Only count membership types that exist in the database
        if (validMembershipTypes.includes(member.membership_type)) {
          acc[member.membership_type] = (acc[member.membership_type] || 0) + 1;
        }
        return acc;
      }, {});

      // Transform to chart format with French translations
      const chartData = Object.entries(distribution).map(([key, value]) => ({
        name: translateToFrench(key), // Translate the membership type to French
        value: value as number,
      }));

      // If no data after filtering, add placeholder data
      if (chartData.length === 0 && membershipTypesData) {
        chartData.push(
          ...membershipTypesData.map(type => ({
            name: translateToFrench(type.type),
            value: 0
          }))
        );
      }

      setMembershipData(chartData);
    } catch (error) {
      console.error("Error fetching membership data:", error);
      // Set default empty data in case of error
      setMembershipData([]);
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const { data: attendance, error } = await supabase
        .from("attendance")
        .select("check_in_time")
        .gte("check_in_time", subMonths(new Date(), 1).toISOString());

      if (error) throw error;

      if (!attendance || attendance.length === 0) {
        // If no data, return empty or placeholder data
        setAttendanceData([]);
        return;
      }

      // Group by day of week
      const weeklyAttendance = attendance.reduce((acc: any, record) => {
        const day = format(parseISO(record.check_in_time), "EEE");
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      // Group by hour of day for peak hours chart
      const hourlyAttendance = attendance.reduce((acc: any, record) => {
        const hour = format(parseISO(record.check_in_time), "H");
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      // Define all days of the week to ensure we have entries for days with no attendance
      const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      // Create chart data with all days, using 0 for days with no attendance
      const chartData = allDays.map(day => ({
        day,
        visitors: weeklyAttendance[day] || 0,
      }));

      // Store hourly attendance data in a separate state variable
      const hourlyData = [
        { hour: "6-8h", visitors: (hourlyAttendance["6"] || 0) + (hourlyAttendance["7"] || 0) },
        { hour: "8-10h", visitors: (hourlyAttendance["8"] || 0) + (hourlyAttendance["9"] || 0) },
        { hour: "10-12h", visitors: (hourlyAttendance["10"] || 0) + (hourlyAttendance["11"] || 0) },
        { hour: "12-14h", visitors: (hourlyAttendance["12"] || 0) + (hourlyAttendance["13"] || 0) },
        { hour: "14-16h", visitors: (hourlyAttendance["14"] || 0) + (hourlyAttendance["15"] || 0) },
        { hour: "16-18h", visitors: (hourlyAttendance["16"] || 0) + (hourlyAttendance["17"] || 0) },
        { hour: "18-20h", visitors: (hourlyAttendance["18"] || 0) + (hourlyAttendance["19"] || 0) },
        { hour: "20-22h", visitors: (hourlyAttendance["20"] || 0) + (hourlyAttendance["21"] || 0) },
      ];

      // Set both data sets
      setAttendanceData({
        weeklyData: chartData,
        hourlyData: hourlyData
      });
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      // Set default empty data in case of error
      setAttendanceData({
        weeklyData: [],
        hourlyData: []
      });
    }
  };

  // Fetch all data when component mounts or reportType changes
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchRevenueData(),
        fetchMembershipData(),
        fetchAttendanceData(),
        fetchSummaryData()
      ]);
      setIsLoading(false);
    };

    fetchAllData();
  }, [reportType]); // Re-fetch when reportType changes

  return {
    isLoading,
    revenueData,
    membershipData,
    attendanceData,
    summaryData,
    monthlyComparison,
    calculatePercentageChange,
    fetchRevenueData,
    fetchMembershipData,
    fetchAttendanceData,
    fetchSummaryData
  };
}
