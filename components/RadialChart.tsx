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
    <div className="flex flex-col items-center justify-center h-full">
      <div className="h-24 w-24 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell key={`cell-0`} fill={color} />
              <Cell key={`cell-1`} fill="#334155" /> 
            </Pie>
            
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default RadialChart;