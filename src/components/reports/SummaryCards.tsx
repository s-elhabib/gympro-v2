import React from 'react';
import { DollarSign, Users, UserPlus, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface SummaryCardsProps {
  summaryData: {
    totalRevenue: number;
    activeMembers: number;
    newSignups: number;
    avgRevenuePerMember: number;
  };
  monthlyComparison: {
    revenue: { current: number; previous: number };
    members: { current: number; previous: number };
    newMembers: { current: number; previous: number };
    avgRevenue: { current: number; previous: number };
  };
  calculatePercentageChange: (current: number, previous: number) => number;
  isLoading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summaryData,
  monthlyComparison,
  calculatePercentageChange,
  isLoading
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Revenue Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Revenus Mensuels</span>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <span className="text-2xl font-bold">{formatCurrency(summaryData.totalRevenue)}</span>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <div className="flex items-center mt-2">
              {calculatePercentageChange(
                monthlyComparison.revenue.current,
                monthlyComparison.revenue.previous
              ) >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">
                    +{calculatePercentageChange(
                      monthlyComparison.revenue.current,
                      monthlyComparison.revenue.previous
                    ).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">
                    {calculatePercentageChange(
                      monthlyComparison.revenue.current,
                      monthlyComparison.revenue.previous
                    ).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-2">vs mois précédent</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Members Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Membres Actifs</span>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <span className="text-2xl font-bold">{summaryData.activeMembers}</span>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <div className="flex items-center mt-2">
              {calculatePercentageChange(
                monthlyComparison.members.current,
                monthlyComparison.members.previous
              ) >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">
                    +{calculatePercentageChange(
                      monthlyComparison.members.current,
                      monthlyComparison.members.previous
                    ).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">
                    {calculatePercentageChange(
                      monthlyComparison.members.current,
                      monthlyComparison.members.previous
                    ).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-2">vs mois précédent</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Signups Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Nouvelles Inscriptions</span>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <span className="text-2xl font-bold">{summaryData.newSignups}</span>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <div className="flex items-center mt-2">
              {calculatePercentageChange(
                monthlyComparison.newMembers.current,
                monthlyComparison.newMembers.previous
              ) >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">
                    +{calculatePercentageChange(
                      monthlyComparison.newMembers.current,
                      monthlyComparison.newMembers.previous
                    ).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">
                    {calculatePercentageChange(
                      monthlyComparison.newMembers.current,
                      monthlyComparison.newMembers.previous
                    ).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-2">vs mois précédent</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Average Revenue Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Revenu Moyen / Membre</span>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <span className="text-2xl font-bold">{formatCurrency(summaryData.avgRevenuePerMember)}</span>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          
          {isLoading ? (
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <div className="flex items-center mt-2">
              {calculatePercentageChange(
                monthlyComparison.avgRevenue.current,
                monthlyComparison.avgRevenue.previous
              ) >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">
                    +{calculatePercentageChange(
                      monthlyComparison.avgRevenue.current,
                      monthlyComparison.avgRevenue.previous
                    ).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">
                    {calculatePercentageChange(
                      monthlyComparison.avgRevenue.current,
                      monthlyComparison.avgRevenue.previous
                    ).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-2">vs mois précédent</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
