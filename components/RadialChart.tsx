import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface RadialChartProps {
  score: number;
  label: string;
  color: string;
}

const RadialChart: React.FC<RadialChartProps> = ({ score, label, color }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remainder', value: 100 - score },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="relative flex items-center justify-center">
        <PieChart width={64} height={64}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={30}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell key={`cell-0`} fill={color} />
            <Cell key={`cell-1`} fill="#334155" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{score}</span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</span>}
    </div>
  );
};

export default RadialChart;