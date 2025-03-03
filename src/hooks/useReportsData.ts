import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonth, subMonths, format } from 'date-fns';

export const useReportsData = () => {
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    activeMembers: 0,
    newRegistrations: 0,
    averageRevenue: 0
  });
  
  const [monthlyComparison, setMonthlyComparison] = useState({
    revenue: { current: 0, previous: 0 },
    members: { current: 0, previous: 0 },
    newMembers: { current: 0, previous: 0 },
    averageRevenue: { current: 0, previous: 0 }
  });

  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchSummaryData = async () => {
    try {
      const currentMonthStart = startOfMonth(new Date());
      const previousMonthStart = startOfMonth(subMonths(new Date(), 1));

      // Get revenue data for current and previous month
      const { data: currentRevenueData, error: currentRevenueError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: previousRevenueData, error: previousRevenueError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      if (currentRevenueError || previousRevenueError) throw currentRevenueError || previousRevenueError;

      // Get active members count for current and previous month
      const { data: currentActiveMembers, error: currentMembersError } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active');

      const { data: previousActiveMembers, error: previousMembersError } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', currentMonthStart.toISOString());

      if (currentMembersError || previousMembersError) throw currentMembersError || previousMembersError;

      // Get new registrations for current and previous month
      const { data: currentNewMembers, error: currentNewMembersError } = await supabase
        .from('members')
        .select('id')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: previousNewMembers, error: previousNewMembersError } = await supabase
        .from('members')
        .select('id')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      if (currentNewMembersError || previousNewMembersError) throw currentNewMembersError || previousNewMembersError;

      // Calculate totals
      const currentRevenue = currentRevenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const previousRevenue = previousRevenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const currentAverageRevenue = currentActiveMembers?.length > 0 ? currentRevenue / currentActiveMembers.length : 0;
      const previousAverageRevenue = previousActiveMembers?.length > 0 ? previousRevenue / previousActiveMembers.length : 0;

      setSummaryData({
        totalRevenue: currentRevenue,
        activeMembers: currentActiveMembers?.length || 0,
        newRegistrations: currentNewMembers?.length || 0,
        averageRevenue: currentAverageRevenue
      });

      setMonthlyComparison({
        revenue: { current: currentRevenue, previous: previousRevenue },
        members: { 
          current: currentActiveMembers?.length || 0, 
          previous: previousActiveMembers?.length || 0 
        },
        newMembers: { 
          current: currentNewMembers?.length || 0, 
          previous: previousNewMembers?.length || 0 
        },
        averageRevenue: { current: currentAverageRevenue, previous: previousAverageRevenue }
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, created_at')
        .gte('created_at', subMonths(new Date(), 6).toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by month and sum amounts
      const monthlyRevenue = data.reduce((acc: any, payment: any) => {
        const month = format(new Date(payment.created_at), 'MMM');
        acc[month] = (acc[month] || 0) + Number(payment.amount);
        return acc;
      }, {});

      setRevenueData(Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue: Number(revenue)
      })));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchSummaryData(),
        fetchRevenueData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    summaryData,
    monthlyComparison,
    revenueData,
    isLoading,
    calculatePercentageChange
  };
}; 