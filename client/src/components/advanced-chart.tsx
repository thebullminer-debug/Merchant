import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface AdvancedChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showTooltips?: boolean;
  gradient?: boolean;
}

export function AdvancedChart({ 
  type, 
  data, 
  title, 
  height = 300, 
  showLegend = true,
  showTooltips = true,
  gradient = false 
}: AdvancedChartProps) {
  
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: 'hsl(var(--foreground))',
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        enabled: showTooltips,
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (type === 'doughnut') {
              const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
            return `${label}: ${typeof value === 'number' ? value.toLocaleString() : value}`;
          }
        }
      }
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            family: 'Inter, sans-serif',
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            family: 'Inter, sans-serif',
            size: 11
          },
          callback: function(value: any) {
            if (typeof value === 'number') {
              return value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`;
            }
            return value;
          }
        }
      }
    } : {}
  };

  // Apply gradient effects for line charts
  if (type === 'line' && gradient && data.datasets) {
    data.datasets = data.datasets.map((dataset: any, index: number) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
        const colors = [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(var(--accent))',
          'hsl(var(--destructive))'
        ];
        const color = colors[index % colors.length];
        
        gradientFill.addColorStop(0, color + '40');
        gradientFill.addColorStop(1, color + '10');
        
        return {
          ...dataset,
          backgroundColor: gradientFill,
          borderColor: color,
          fill: true,
          tension: 0.4
        };
      }
      return dataset;
    });
  }

  const chartComponents = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut
  };

  const ChartComponent = chartComponents[type];

  return (
    <div style={{ height: `${height}px` }}>
      <ChartComponent 
        data={data} 
        options={options}
        data-testid={`chart-${type}`}
      />
    </div>
  );
}