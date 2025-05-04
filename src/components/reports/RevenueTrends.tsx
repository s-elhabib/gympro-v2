import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface RevenueTrendsProps {
  data: any[];
}

export const RevenueTrends: React.FC<RevenueTrendsProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600 font-medium">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tendances des Revenus</CardTitle>
          <CardDescription>Évolution des revenus sur les 6 derniers mois</CardDescription>
        </div>
        <Select value={chartType} onValueChange={(value: 'bar' | 'line') => setChartType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type de graphique" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Graphique à barres</SelectItem>
            <SelectItem value="line">Graphique linéaire</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `${value / 1000}k`}
                  domain={[0, 'dataMax + 500000']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  name="Revenus" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            ) : (
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `${value / 1000}k`}
                  domain={[0, 'dataMax + 500000']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenus" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Revenu Total</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Revenu Moyen Mensuel</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0) / (data.length || 1))}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Mois le Plus Rentable</p>
            <p className="text-2xl font-bold mt-1">
              {data.length > 0 
                ? data.reduce((max, item) => item.revenue > max.revenue ? item : max, data[0]).month
                : '-'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
