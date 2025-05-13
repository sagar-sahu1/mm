
"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from '@/providers/ThemeProvider'; // Using next-themes directly for chart colors
import { useMemo, useEffect, useState as ReactUseState } from 'react'; // Renamed useState to ReactUseState to avoid conflict

interface QuizDifficultyPieChartProps {
  data: { name: string; value: number }[];
}

const difficultyColorsLight: Record<string, string> = {
  easy: "hsl(var(--chart-2))",   // Teal-ish
  medium: "hsl(var(--chart-1))", // Indigo-ish
  hard: "hsl(var(--chart-5))",    // Orange-ish/Red-ish
};

const difficultyColorsDark: Record<string, string> = {
  easy: "hsl(var(--chart-2))",   // Brighter Teal-ish for dark
  medium: "hsl(var(--chart-1))", // Brighter Indigo-ish for dark
  hard: "hsl(var(--chart-5))",    // Brighter Orange-ish for dark
};


export function QuizDifficultyPieChart({ data }: QuizDifficultyPieChartProps) {
  const { theme } = useTheme(); // 'light', 'dark', or 'system'
  const [isClient, setIsClient] = ReactUseState(false); // Using aliased useState

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const currentColors = useMemo(() => {
    let resolvedTheme = theme;
    if (theme === 'system' && typeof window !== 'undefined') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return resolvedTheme === 'dark' ? difficultyColorsDark : difficultyColorsLight;
  }, [theme]);


  if (!isClient) {
    return <div className="h-[300px] w-full flex items-center justify-center"><p>Loading chart...</p></div>;
  }
  
  const total = data.reduce((acc, entry) => acc + entry.value, 0);

  if (total === 0) {
    return (
      <Card className="shadow-md h-full">
        <CardHeader>
          <CardTitle className="text-xl">Quiz Difficulty Mix</CardTitle>
          <CardDescription>Distribution of your completed quizzes by difficulty.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No completed quizzes to display.</p>
        </CardContent>
      </Card>
    )
  }


  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Quiz Difficulty Mix</CardTitle>
        <CardDescription>Distribution of your completed quizzes by difficulty.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                 const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                 const x = cx + (radius + 15) * Math.cos(-midAngle * (Math.PI / 180));
                 const y = cy + (radius + 15) * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text x={x} y={y} fill={currentColors[name.toLowerCase() as keyof typeof currentColors] || "#8884d8"} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={currentColors[entry.name.toLowerCase() as keyof typeof currentColors] || "#8884d8"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? 'hsl(var(--popover))' : 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--popover-foreground))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number, name: string) => [`${value} quiz${value === 1 ? '' : 'zes'}`, name]}
            />
            <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

