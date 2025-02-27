import React from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '12m' | 'all';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const getTimeRangeLabel = (range: TimeRange): string => {
  switch (range) {
    case '24h':
      return 'Last 24 hours';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    case '12m':
      return 'Last 12 months';
    case 'all':
      return 'All time';
    default:
      return 'Custom';
  }
};

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ value, onChange }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <CalendarDays className="mr-2 h-4 w-4" />
          {getTimeRangeLabel(value)}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem onClick={() => onChange('24h')}>
          Last 24 hours
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('7d')}>
          Last 7 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('30d')}>
          Last 30 days
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChange('90d')}>
          Last 90 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('12m')}>
          Last 12 months
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('all')}>
          All time
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TimeRangeFilter;