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
      return 'Dernières 24 heures';
    case '7d':
      return 'Derniers 7 jours';
    case '30d':
      return 'Derniers 30 jours';
    case '90d':
      return 'Derniers 90 jours';
    case '12m':
      return 'Derniers 12 mois';
    case 'all':
      return 'Tout le temps';
    default:
      return 'Personnalisé';
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
          Dernières 24 heures
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('7d')}>
          Derniers 7 jours
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('30d')}>
          Derniers 30 jours
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChange('90d')}>
          Derniers 90 jours
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('12m')}>
          Derniers 12 mois
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('all')}>
          Tout le temps
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TimeRangeFilter;