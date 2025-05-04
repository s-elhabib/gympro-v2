import { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { supabase } from '../lib/supabase';

export function useReportsData() {
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [membershipData, setMembershipData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
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

  // Fetch summary data
  const fetchSummaryData = async () => {
    try {
      const currentMonthStart = startOfMonth(new Date());
      const previousMonthStart = startOfMonth(subMonths(new Date(), 1));

      // Current month revenue
      const { data: currentRevenue } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", currentMonthStart.toISOString());

      // Previous month revenue
      const { data: previousRevenue } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", previousMonthStart.toISOString())
        .lt("created_at", currentMonthStart.toISOString());

      // Active members
      const { data: currentActiveMembers } = await supabase
        .from("members")
        .select("id")
        .eq("status", "active");

      const { data: previousActiveMembers } = await supabase
        .from("members")
        .select("id")
        .eq("status", "active")
        .lt("created_at", currentMonthStart.toISOString());

      // New signups
      const { data: currentNewMembers } = await supabase
        .from("members")
        .select("id")
        .gte("created_at", currentMonthStart.toISOString());

      const { data: previousNewMembers } = await supabase
        .from("members")
        .select("id")
        .gte("created_at", previousMonthStart.toISOString())
        .lt("created_at", currentMonthStart.toISOString());

      // Calculate totals
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
    }
  };

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      const startDate = startOfMonth(subMonths(new Date(), 5));
      const endDate = endOfMonth(new Date());

      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, payment_date, status")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString())
        .eq("status", "paid");

      if (error) throw error;

      // Group payments by month
      const monthlyRevenue = payments?.reduce((acc: any, payment) => {
        const month = format(parseISO(payment.payment_date), "MMM");
        acc[month] = (acc[month] || 0) + payment.amount;
        return acc;
      }, {});

      // Transform to chart format
      const chartData = Object.entries(monthlyRevenue || {}).map(
        ([month, revenue]) => ({
          month,
          revenue,
        })
      );

      setRevenueData(chartData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    }
  };

  // Fetch membership distribution
  const fetchMembershipData = async () => {
    try {
      const { data: members, error } = await supabase
        .from("members")
        .select("membership_type")
        .eq("status", "active");

      if (error) throw error;

      // Count membership types
      const distribution = members?.reduce((acc: any, member) => {
        acc[member.membership_type] = (acc[member.membership_type] || 0) + 1;
        return acc;
      }, {});

      // Transform to chart format
      const chartData = Object.entries(distribution || {}).map(
        ([name, value]) => ({
          name:
            name === "monthly"
              ? "Mensuel"
              : name === "quarterly"
              ? "Trimestriel"
              : name === "annual"
              ? "Annuel"
              : name === "daily"
              ? "Pass Journalier"
              : name,
          value,
        })
      );

      setMembershipData(chartData);
    } catch (error) {
      console.error("Error fetching membership data:", error);
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

      // Group by day of week
      const weeklyAttendance = attendance?.reduce((acc: any, record) => {
        const day = format(parseISO(record.check_in_time), "EEE");
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      // Transform to chart format
      const chartData = Object.entries(weeklyAttendance || {}).map(
        ([day, visitors]) => ({
          day,
          visitors,
        })
      );

      setAttendanceData(chartData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  // Fetch all data on component mount
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
  }, []);

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
