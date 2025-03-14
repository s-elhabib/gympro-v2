import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
      fill: boolean;
    }[];
  };
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  // Create a unique ID for the chart
  const chartId = React.useId();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Aperçu des Revenus</h2>
          <p className="text-sm text-gray-500">12 derniers mois</p>
        </div>
      </div>
      <div className="h-[300px] md:h-[400px]">
        {data.datasets[0].data.some(value => value > 0) ? (
          <Line
            id={chartId}
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  backgroundColor: 'white',
                  titleColor: 'black',
                  bodyColor: 'black',
                  borderColor: 'rgb(229, 231, 235)',
                  borderWidth: 1,
                  padding: 12,
                  titleFont: {
                    size: 14,
                    weight: '600'
                  },
                  bodyFont: {
                    size: 13
                  },
                  callbacks: {
                    label: function(context) {
                      let value = context.parsed.y;
                      return `Revenu: ${new Intl.NumberFormat('ar-MA', { 
                        style: 'currency', 
                        currency: 'MAD' 
                      }).format(value)}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  type: 'category',
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      size: 12
                    }
                  }
                },
                y: {
                  type: 'linear',
                  border: {
                    display: false
                  },
                  grid: {
                    color: 'rgb(243, 244, 246)'
                  },
                  ticks: {
                    font: {
                      size: 12
                    },
                    callback: function(value) {
                      return value.toLocaleString() + ' MAD';
                    }
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index'
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucune donnée de revenu disponible pour la période sélectionnée
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;