import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: number;
  percentageChange: number;
  isCurrency?: boolean;
}

export const SummaryCard = ({ title, value, percentageChange, isCurrency = false }: SummaryCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isCurrency 
            ? `${value.toLocaleString('fr-FR')} MAD`
            : value.toLocaleString('fr-FR')
          }
        </div>
        <p className={`text-xs flex items-center mt-1 ${
          percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {percentageChange >= 0 
            ? <ArrowUpRight className="h-3 w-3 mr-1" />
            : <ArrowDownRight className="h-3 w-3 mr-1" />
          }
          {Math.abs(percentageChange).toFixed(1)}% par rapport au mois dernier
        </p>
      </CardContent>
    </Card>
  );
}; 