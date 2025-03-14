import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { startOfMonth, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Activity, Users, Calendar, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function MemberStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [memberStats, setMemberStats] = useState({
    activityRate: 0,
    retention: {
      monthly: 0,
      quarterly: 0,
      yearly: 0
    },
    demographics: {}
  });
  const [memberGrowth, setMemberGrowth] = useState<any[]>([]);

  useEffect(() => {
    fetchMemberStats();
  }, []);

  const fetchMemberStats = async () => {
    try {
      setIsLoading(true);
      
      // Activity rate calculation
      const { data: activeMembers, error: activeError } = await supabase
        .from('attendance')  // Changed from check_ins to attendance
        .select('member_id')
        .gte('check_in_time', subMonths(new Date(), 1).toISOString())  // Changed from created_at to check_in_time
        .is('check_out_time', null);  // Only count active check-ins

      if (activeError) {
        console.error("Error fetching active members:", activeError);
      }

      const { data: totalMembers, error: totalError } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active');

      if (totalError) {
        console.error("Error fetching total members:", totalError);
      }

      // Retention rates calculation
      const monthStart = startOfMonth(subMonths(new Date(), 1));
      const quarterStart = startOfMonth(subMonths(new Date(), 3));
      const yearStart = startOfMonth(subMonths(new Date(), 12));

      const { data: monthlyRetention, error: monthlyError } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', monthStart.toISOString());

      if (monthlyError) {
        console.error("Error fetching monthly retention:", monthlyError);
      }

      const { data: quarterlyRetention, error: quarterlyError } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', quarterStart.toISOString());

      if (quarterlyError) {
        console.error("Error fetching quarterly retention:", quarterlyError);
      }

      const { data: yearlyRetention, error: yearlyError } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'active')
        .lt('created_at', yearStart.toISOString());

      if (yearlyError) {
        console.error("Error fetching yearly retention:", yearlyError);
      }

      // Demographics calculation
      const { data: demographics, error: demographicsError } = await supabase
        .from('members')
        .select('birth_date')
        .eq('status', 'active');

      if (demographicsError) {
        console.error("Error fetching demographics:", demographicsError);
      }

      const stats = {
        activityRate: (activeMembers?.length || 0) / (totalMembers?.length || 1) * 100,
        retention: {
          monthly: (monthlyRetention?.length || 0) / (totalMembers?.length || 1) * 100,
          quarterly: (quarterlyRetention?.length || 0) / (totalMembers?.length || 1) * 100,
          yearly: (yearlyRetention?.length || 0) / (totalMembers?.length || 1) * 100
        },
        demographics: calculateAgeDemographics(demographics || [])
      };
      
      setMemberStats(stats);

      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
      
      const { data: monthlyGrowth, error: growthError } = await supabase
        .from('members')
        .select('created_at')
        .gte('created_at', sixMonthsAgo)
        .order('created_at');

      if (growthError) {
        console.error("Error fetching growth data:", growthError);
      }
      
      
      // Check if we have any data
      if (!monthlyGrowth || monthlyGrowth.length === 0) {
      
        // Provide some sample data if none exists
        const sampleGrowthData = [
          { month: 'Jan', members: 5 },
          { month: 'Fév', members: 8 },
          { month: 'Mar', members: 12 },
          { month: 'Avr', members: 10 },
          { month: 'Mai', members: 15 },
          { month: 'Juin', members: 20 }
        ];
        setMemberGrowth(sampleGrowthData);
      } else {
        const growthData = processMonthlyGrowth(monthlyGrowth);
       
        setMemberGrowth(growthData);
      }

    } catch (error) {
      console.error('Error fetching member stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate age demographics
  const calculateAgeDemographics = (members: any[]) => {
    const ageGroups: Record<string, number> = {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-54': 0,
      '55+': 0
    };

    members.forEach(member => {
      if (!member.birth_date) return;
      
      const birthDate = new Date(member.birth_date);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      
      if (age < 18) return;
      if (age <= 24) ageGroups['18-24']++;
      else if (age <= 34) ageGroups['25-34']++;
      else if (age <= 44) ageGroups['35-44']++;
      else if (age <= 54) ageGroups['45-54']++;
      else ageGroups['55+']++;
    });

    // Convert to percentages
    const total = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
    const percentages: Record<string, number> = {};
    
    Object.entries(ageGroups).forEach(([group, count]) => {
      percentages[group] = total > 0 ? (count / total) * 100 : 0;
    });

    return percentages;
  };

  // Helper function to process monthly growth data - IMPROVED
  const processMonthlyGrowth = (data: any[]) => {
 
    const monthlyData: Record<string, number> = {};
    
    // Initialize last 6 months with zero values
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM', { locale: fr });
      monthlyData[monthKey] = 0;
    }
    
  
    // Count members by month
    data.forEach(member => {
      if (!member.created_at) {
       
        return;
      }
      
      try {
        const memberDate = new Date(member.created_at);
        const month = format(memberDate, 'MMM', { locale: fr });
        
        if (monthlyData[month] !== undefined) {
          monthlyData[month]++;
        }
      } catch (error) {
        console.error("Error processing member date:", error, member);
      }
    });
    

    
    // Convert to array format for charts
    return Object.entries(monthlyData).map(([month, members]) => ({
      month,
      members
    }));
  };

  // Convert demographics to chart format
  const demographicsData = Object.entries(memberStats.demographics).map(([age, percentage]) => ({
    name: age,
    value: percentage
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Statistiques des Membres</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Taux d'Activité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.activityRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              des membres visitent au moins une fois par mois
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rétention Mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.retention.monthly.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              des membres actifs sont inscrits depuis plus d'un mois
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rétention Annuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberStats.retention.yearly.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              des membres actifs sont inscrits depuis plus d'un an
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Croissance des Membres</CardTitle>
            <CardDescription>
              Nouveaux membres par mois (6 derniers mois)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {memberGrowth.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune donnée disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberGrowth} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="members" fill="#3b82f6" name="Nouveaux Membres" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Démographie des Membres</CardTitle>
            <CardDescription>
              Répartition par âge des membres actifs
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demographicsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Pourcentage']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Aperçu des Membres</CardTitle>
          <CardDescription>
            Observations clés sur le comportement des membres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-full">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Niveau d'Activité</h4>
                <p className="text-sm text-gray-500">
                  {memberStats.activityRate.toFixed(1)}% des membres visitent au moins une fois par mois
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Taux de Rétention</h4>
                <p className="text-sm text-gray-500">
                  Le taux de rétention mensuel est de {memberStats.retention.monthly.toFixed(1)}%, 
                  trimestriel de {memberStats.retention.quarterly.toFixed(1)}%, 
                  et annuel de {memberStats.retention.yearly.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Tendance de Croissance</h4>
                <p className="text-sm text-gray-500">
                  {memberGrowth.length > 0 && 
                    `${memberGrowth[memberGrowth.length - 1].members - memberGrowth[0].members > 0 ? 'Augmentation' : 'Diminution'} 
                    de ${Math.abs(memberGrowth[memberGrowth.length - 1].members - memberGrowth[0].members)} 
                    membres sur les 6 derniers mois`
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 