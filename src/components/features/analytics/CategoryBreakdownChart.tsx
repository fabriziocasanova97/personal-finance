'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface CategoryDataPoint {
  name: string;
  value: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryDataPoint[];
}

// A vibrant, modern palette generated to look premium
const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', 
  '#F59E0B', '#10B981', '#14B8A6', '#6366F1'
];

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  // Filter out $0 categories for cleaner chart
  const activeData = data.filter(d => d.value > 0);

  if (!activeData || activeData.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-gray-400">
        <p>No expenses for this month yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {activeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="hover:opacity-80 transition-opacity duration-200"
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, undefined]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #F3F4F6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
            itemStyle={{ fontWeight: 600 }}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            wrapperStyle={{ paddingLeft: '15px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
