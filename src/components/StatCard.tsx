import React from 'react';
import { ArrowUpRight, ArrowDownRight, Lock } from 'lucide-react';
import TimeRangeFilter, { TimeRange } from './TimeRangeFilter';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  trend: number;
  isPositive: boolean;
  format?: 'number' | 'currency';
  showTimeRangeFilter?: boolean;
  onTimeRangeChange?: (range: TimeRange) => void;
  isLocked?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  trend,
  isPositive,
  format = 'number',
  showTimeRangeFilter = false,
  onTimeRangeChange,
  isLocked = false,
  isLoading = false,
  onClick,
  clickable = false
}) => {
  const [timeRange, setTimeRange] = React.useState<TimeRange>('30d');

  const formattedValue = format === 'currency'
    ? `${new Intl.NumberFormat('fr-FR').format(value)} MAD`
    : new Intl.NumberFormat('fr-FR').format(value);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };

  if (isLocked) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
          <Lock className="h-8 w-8" />
          <p className="text-sm font-medium text-center">Cette information est uniquement visible par les administrateurs</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg p-6 shadow-sm ${clickable ? 'cursor-pointer hover:shadow-md hover:bg-gray-50' : 'hover:shadow-md'} transition-all relative`}
      onClick={clickable ? onClick : undefined}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        {showTimeRangeFilter ? (
          <TimeRangeFilter value={timeRange} onChange={handleTimeRangeChange} />
        ) : (
          <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{new Intl.NumberFormat('fr-FR', {
              style: 'percent',
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            }).format(trend / 100)}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-semibold text-gray-900">{formattedValue}</h3>
        <p className="text-sm text-gray-500">{label}</p>
        {showTimeRangeFilter && (
          <div className={`flex items-center text-sm mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{new Intl.NumberFormat('fr-FR', {
              style: 'percent',
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            }).format(trend / 100)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard