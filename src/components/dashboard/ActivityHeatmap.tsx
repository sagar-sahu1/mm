
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getUserLoginActivityForYear, type UserActivityLog } from '@/lib/firestoreUtils'; // Changed import
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
  getDay,
  getWeek,
  differenceInCalendarWeeks,
  addDays,
  subYears,
  getYear
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ActivityHeatmapProps {
  userId: string;
}

interface HeatmapCellData {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 for no activity, 1-4 for increasing activity
}

const currentYear = getYear(new Date());
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i); // Last 5 years

export function ActivityHeatmap({ userId }: ActivityHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activityData, setActivityData] = useState<UserActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      setIsLoading(true);
      const data = await getUserLoginActivityForYear(userId, selectedYear); // Changed function call
      setActivityData(data);
      setIsLoading(false);
    }
    fetchData();
  }, [userId, selectedYear]);

  const heatmapGrid = useMemo(() => {
    if (!activityData) return { weeks: [], monthLabels: [] };

    const yearStartDate = startOfYear(new Date(selectedYear, 0, 1));
    const yearEndDate = endOfYear(new Date(selectedYear, 11, 31));
    const daysInYear = eachDayOfInterval({ start: yearStartDate, end: yearEndDate });

    const loginsByDate: Record<string, number> = {};
    activityData.forEach(log => {
      const dateStr = format(log.timestamp.toDate(), 'yyyy-MM-dd');
      loginsByDate[dateStr] = (loginsByDate[dateStr] || 0) + 1;
    });

    // Determine max count for scaling levels (simplified scaling)
    let maxCount = 0;
    Object.values(loginsByDate).forEach(count => {
      if (count > maxCount) maxCount = count;
    });

    const getLevel = (count: number): HeatmapCellData['level'] => {
      if (count === 0) return 0;
      if (maxCount === 0) return 0; // Avoid division by zero if no activity
      const percentage = count / maxCount;
      if (percentage > 0.75) return 4;
      if (percentage > 0.5) return 3;
      if (percentage > 0.25) return 2;
      return 1;
    };
    
    const firstDayOfYear = startOfYear(new Date(selectedYear, 0, 1));
    // JavaScript's getDay(): 0 (Sun) - 6 (Sat). We want Monday as 0.
    const startOffset = (getDay(firstDayOfYear) + 6) % 7; // 0 (Mon) - 6 (Sun)

    const weeks: HeatmapCellData[][] = Array.from({ length: 53 }, () => []);
    const monthLabels: { label: string, weekIndex: number }[] = [];
    let currentMonth = -1;

    daysInYear.forEach(date => {
      const dayOfWeek = (getDay(date) + 6) % 7; // Monday is 0
      const weekOfYear = getWeek(date, { weekStartsOn: 1 }); // Monday as first day of week

      // Adjust weekOfYear for years starting mid-week, ensuring alignment with 53 columns
      // This is a simplified week calculation for heatmap display.
      // A more robust method might be needed for perfect GitHub alignment.
      const displayWeekIndex = differenceInCalendarWeeks(date, startOfYear(new Date(selectedYear,0,1)), {weekStartsOn:1});
      if(startOffset > 0 && getWeek(startOfYear(new Date(selectedYear,0,1)), {weekStartsOn:1}) === 52 || getWeek(startOfYear(new Date(selectedYear,0,1)), {weekStartsOn:1}) === 53 ) {
         // If Jan 1st is in week 52/53 of previous year, the first week in heatmap is that week.
      } else if (startOffset > 0) {
        // if Jan 1st is Tue-Sun, and it's week 1, the first few days are in column 0.
      }


      const dateStr = format(date, 'yyyy-MM-dd');
      const count = loginsByDate[dateStr] || 0;
      
      if (weeks[displayWeekIndex]) {
         // Initialize day slots if not already
        if (!weeks[displayWeekIndex][dayOfWeek]) {
             // Fill up to dayOfWeek with empty cells if needed.
             // This logic is tricky; for now, just assign.
        }
        weeks[displayWeekIndex][dayOfWeek] = { date, count, level: getLevel(count) };
      }


      const month = date.getMonth();
      if (month !== currentMonth) {
        monthLabels.push({ label: format(date, 'MMM'), weekIndex: displayWeekIndex });
        currentMonth = month;
      }
    });
    
    // Pad weeks to ensure all have 7 days for consistent rendering
     weeks.forEach((week, weekIdx) => {
        const dayCells: (HeatmapCellData | null)[] = Array(7).fill(null);
        // This part needs careful alignment of actual day data with 7 slots
        // The current `weeks[displayWeekIndex][dayOfWeek]` assignment might be sparse
        // We need to map actual days in `daysInYear` to the grid cells more explicitly.
        
        // Simplified: fill based on what was populated
        for (let i=0; i<7; i++) {
            if (week[i]) { // week[i] is the HeatmapCellData if it exists
                dayCells[i] = week[i];
            }
        }
        weeks[weekIdx] = dayCells as HeatmapCellData[]; // Assuming all cells are filled or null
    });


    return { weeks, monthLabels };

  }, [activityData, selectedYear]);


  const getCellColor = (level: HeatmapCellData['level']) => {
    switch (level) {
      case 0: return 'bg-muted/20 hover:bg-muted/40'; // No activity
      case 1: return 'bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700';
      case 2: return 'bg-green-400 dark:bg-green-600 hover:bg-green-500 dark:hover:bg-green-500';
      case 3: return 'bg-green-600 dark:bg-green-400 hover:bg-green-700 dark:hover:bg-green-300';
      case 4: return 'bg-green-800 dark:bg-green-200 hover:bg-green-900 dark:hover:bg-green-100';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']; // Only show Mon, Wed, Fri

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Login Activity ({selectedYear})</CardTitle>
        <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={String(year)} className="text-xs">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 overflow-x-auto">
        <TooltipProvider delayDuration={100}>
          <div className="flex">
            {/* Day Labels */}
            <div className="flex flex-col justify-between text-xs text-muted-foreground mr-1 pt-[calc(1.25rem+2px)]"> {/* pt to align with cells after month labels */}
              {dayLabels.map((label, i) => (
                <div key={i} className="h-3 flex items-center" style={{ flexBasis: 'calc(100%/7)'}}>{label}</div>
              ))}
            </div>

            <div className="flex flex-col">
              {/* Month Labels */}
              <div className="grid grid-flow-col grid-rows-1 gap-[2px] mb-1" style={{ gridTemplateColumns: `repeat(${heatmapGrid.weeks.length}, minmax(0, 1fr))`}}>
                {heatmapGrid.monthLabels.map((month, index) => {
                   // Position month labels approximately. This needs refinement.
                   // Calculate span based on how many weeks this month label should cover.
                   const nextMonthWeekIndex = heatmapGrid.monthLabels[index+1]?.weekIndex || heatmapGrid.weeks.length;
                   const colSpan = nextMonthWeekIndex - month.weekIndex;
                  return (
                    <div 
                      key={month.label + index} 
                      className="text-xs text-muted-foreground text-center"
                      style={{ gridColumnStart: month.weekIndex + 1, gridColumnEnd: `span ${colSpan > 0 ? colSpan : 1}` }}
                    >
                      {month.label}
                    </div>
                  );
                })}
                 {/* Ensure full width for month labels container */}
                {Array.from({ length: heatmapGrid.weeks.length - heatmapGrid.monthLabels.reduce((acc, curr, idx, arr) => acc + ((arr[idx+1]?.weekIndex || heatmapGrid.weeks.length) - curr.weekIndex) ,0) }).map((_, i) => (
                  <div key={`spacer-${i}`} />
                ))}

              </div>

              {/* Heatmap Grid */}
              <div className="grid grid-flow-col grid-rows-7 gap-[2px]" style={{ gridTemplateColumns: `repeat(${heatmapGrid.weeks.length || 53}, minmax(0, 1fr))`}}>
                {heatmapGrid.weeks.map((weekData, weekIndex) => (
                  <React.Fragment key={`week-${weekIndex}`}>
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const cellData = weekData[dayIndex]; // weekData is now an array of 7 cells (HeatmapCellData or null)
                      if (cellData) {
                        return (
                          <Tooltip key={cellData.date.toISOString()}>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-3 h-3 rounded-sm ${getCellColor(cellData.level)}`}
                                data-date={format(cellData.date, 'yyyy-MM-dd')}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              <p>{cellData.count} login(s) on {format(cellData.date, 'MMM d, yyyy')}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      // Render an empty placeholder cell if no data for this day slot
                      return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3 rounded-sm bg-muted/10" />;
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </TooltipProvider>
        {/* Legend */}
        <div className="flex justify-end items-center text-xs text-muted-foreground mt-2 space-x-2">
          <span>Less</span>
          <div className={`w-2.5 h-2.5 rounded-sm ${getCellColor(1)}`}></div>
          <div className={`w-2.5 h-2.5 rounded-sm ${getCellColor(2)}`}></div>
          <div className={`w-2.5 h-2.5 rounded-sm ${getCellColor(3)}`}></div>
          <div className={`w-2.5 h-2.5 rounded-sm ${getCellColor(4)}`}></div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

