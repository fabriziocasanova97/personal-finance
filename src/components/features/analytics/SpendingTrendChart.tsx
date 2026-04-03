'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SpendingDataPoint {
  month: string;
  Expenses: number;
  Income: number;
  Available: number;
}

interface SpendingTrendChartProps {
  data: SpendingDataPoint[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  // Return empty container if no data helps prevent recharts flashing empty space errors
  if (!data || data.length === 0) return <div className="h-64 w-full flex items-center justify-center text-gray-400">Not enough data to display.</div>;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`} 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip 
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, undefined]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            name="Total Spend"
            dataKey="Expenses" 
            stroke="#EF4444" 
            strokeWidth={3}
            activeDot={{ r: 6 }} 
            dot={{ r: 4, strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            name="Income"
            dataKey="Income" 
            stroke="#10B981" 
            strokeWidth={3} 
            dot={false}
          />
          <Line 
            type="monotone" 
            name="Available"
            dataKey="Available" 
            stroke="#3B82F6" 
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
