import { Report } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import styles from "../SlideRenderer.module.css";

interface KPISlideProps {
  report: Report;
  compact?: boolean;
}

export default function KPISlide({ report, compact = true }: KPISlideProps) {
  const getTrendIcon = (kpi: any) => {
    const trend = kpi.trend;
    const direction = kpi.direction || "higher"; // default to higher if not specified
    
    // Determine if trend is good or bad based on direction
    const isTrendGood = 
      (direction === "higher" && trend === "up") ||
      (direction === "lower" && trend === "down");
    
    const color = isTrendGood ? "text-green-600" : trend === "stable" ? "text-gray-600" : "text-red-600";
    
    switch (trend) {
      case "up":
        return <TrendingUp size={20} className={color} />;
      case "down":
        return <TrendingDown size={20} className={color} />;
      default:
        return <Minus size={20} className="text-gray-600" />;
    }
  };

  const getTrendColor = (kpi: any) => {
    const trend = kpi.trend;
    const direction = kpi.direction || "higher"; // default to higher if not specified
    
    // Determine if trend is good or bad based on direction
    const isTrendGood = 
      (direction === "higher" && trend === "up") ||
      (direction === "lower" && trend === "down");
    
    switch (trend) {
      case "up":
      case "down":
        return isTrendGood ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getProgressPercent = (kpi: any) => {
    if (!kpi.targetValue) return null;
    const percent = Math.min((kpi.value / kpi.targetValue) * 100, 100);
    return Math.round(percent);
  };

  const sortHistoricalData = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // Sort by year, then by quarter order (Q1, Q2, Q3, Q4)
    return [...data].sort((a, b) => {
      const aMatch = a.quarter.match(/Q(\d)-?(\d{4})/);
      const bMatch = b.quarter.match(/Q(\d)-?(\d{4})/);
      
      if (!aMatch || !bMatch) return 0;
      
      const aYear = parseInt(aMatch[2]);
      const bYear = parseInt(bMatch[2]);
      const aQuarter = parseInt(aMatch[1]);
      const bQuarter = parseInt(bMatch[1]);
      
      if (aYear !== bYear) return aYear - bYear;
      return aQuarter - bQuarter;
    });
  };

  return (
    <>
      <h2>Key Performance Indicators</h2>
      <div className={styles.content}>
        {report.kpis.length === 0 ? (
          <p>No KPIs recorded</p>
        ) : (
          <div>
            <div className={`grid ${compact ? "grid-cols-2 gap-3" : "grid-cols-3 gap-4"}`}>
              {report.kpis.slice(0, compact ? 4 : 6).map((kpi) => {
                const progressPercent = getProgressPercent(kpi);
                return (
                  <div
                    key={kpi.id}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p className="m-0 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {kpi.name}
                      </p>
                      <div className={`p-1.5 rounded ${getTrendColor(kpi)}`}>
                        {getTrendIcon(kpi)}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="m-0 text-3xl font-bold text-indigo-700">
                        {kpi.value}
                        <span className="text-sm text-gray-500 ml-1">{kpi.unit}</span>
                      </h3>
                    </div>

                    {progressPercent !== null && (
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">Target: {kpi.targetValue}</span>
                          <span className="text-xs font-bold text-indigo-700">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progressPercent >= 100 ? "bg-green-500" :
                              progressPercent >= 80 ? "bg-blue-500" :
                              progressPercent >= 60 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {kpi.historicalData && kpi.historicalData.length >= 2 && (
                      <div className={`mt-3 ${compact ? "h-24" : "h-32"}`}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sortHistoricalData(kpi.historicalData)} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                            <XAxis 
                              dataKey="quarter" 
                              tick={{ fontSize: compact ? 9 : 11 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={compact ? 40 : 60}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#4f46e5"
                              strokeWidth={2}
                              dot={{ fill: '#4f46e5', r: 4 }}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
