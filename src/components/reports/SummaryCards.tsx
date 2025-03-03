import { SummaryCard } from './SummaryCard';
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardsProps {
  summaryData: {
    totalRevenue: number;
    activeMembers: number;
    newRegistrations: number;
    averageRevenue: number;
  };
  monthlyComparison: {
    revenue: { current: number; previous: number };
    members: { current: number; previous: number };
    newMembers: { current: number; previous: number };
    averageRevenue: { current: number; previous: number };
  };
  calculatePercentageChange: (current: number, previous: number) => number;
  isLoading: boolean;
}

export const SummaryCards = ({ 
  summaryData, 
  monthlyComparison, 
  calculatePercentageChange,
  isLoading 
}: SummaryCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
      <SummaryCard
        title="Revenu Total"
        value={summaryData.totalRevenue}
        percentageChange={calculatePercentageChange(
          monthlyComparison.revenue.current,
          monthlyComparison.revenue.previous
        )}
        isCurrency
      />
      <SummaryCard
        title="Membres Actifs"
        value={summaryData.activeMembers}
        percentageChange={calculatePercentageChange(
          monthlyComparison.members.current,
          monthlyComparison.members.previous
        )}
      />
      <SummaryCard
        title="Nouvelles Inscriptions"
        value={summaryData.newRegistrations}
        percentageChange={calculatePercentageChange(
          monthlyComparison.newMembers.current,
          monthlyComparison.newMembers.previous
        )}
      />
      <SummaryCard
        title="Revenu Moyen Par Membre"
        value={summaryData.averageRevenue}
        percentageChange={calculatePercentageChange(
          monthlyComparison.averageRevenue.current,
          monthlyComparison.averageRevenue.previous
        )}
        isCurrency
      />
    </div>
  );
}; 