import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, isSameDay, subHours, isSameHour, startOfHour } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface HealthPoint {
  timestamp: string;
  up_count: number;
  down_count: number;
  latency: number;
}

export interface UptimeHistory {
  service_id: string;
  hourly: HealthPoint[];
  daily: HealthPoint[];
}

interface UptimeViewProps {
  serviceId: string;
  initialData?: UptimeHistory;
  showBoth?: boolean;
  hideHeader?: boolean;
}

export function UptimeView({ serviceId, initialData, showBoth, hideHeader }: UptimeViewProps) {
  const [view, setView] = useState<"daily" | "hourly">("daily");

  const { data: history, isLoading: loading, error } = useQuery<UptimeHistory>({
    queryKey: ["uptime", serviceId],
    queryFn: async () => {
      if (initialData) return initialData;
      const res = await apiFetch(`/api/services/${serviceId}/uptime`);
      if (!res.ok) throw new Error("Failed to fetch uptime history");
      return res.json();
    },
    initialData,
    enabled: !initialData,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle size={18} />
        <span className="text-sm font-medium">{error instanceof Error ? error.message : "No history available"}</span>
      </div>
    );
  }

  const renderChart = (type: "daily" | "hourly") => {
    const dataPoints = type === "daily" 
      ? Array.from({ length: 30 }).map((_, i) => {
          const date = startOfDay(subDays(new Date(), 29 - i));
          const dayData = history.daily.find((d) => isSameDay(new Date(d.timestamp), date));
          return { date, data: dayData };
        })
      : Array.from({ length: 24 }).map((_, i) => {
          const date = startOfHour(subHours(new Date(), 23 - i));
          const hourData = history.hourly.find((d) => isSameHour(new Date(d.timestamp), date));
          return { date, data: hourData };
        });

    const formattedPoints = dataPoints.map(p => {
      let status: "online" | "offline" | "partial" | "unknown" = "unknown";
      if (p.data) {
        if (p.data.down_count === 0 && p.data.up_count > 0) status = "online";
        else if (p.data.up_count === 0 && p.data.down_count > 0) status = "offline";
        else if (p.data.up_count > 0 && p.data.down_count > 0) status = "partial";
      }
      return { ...p, status };
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{type === "daily" ? "30 Day History" : "24 Hour Precision"}</h4>
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-tight">System Responsive</span>
        </div>
        <div className="flex gap-1 h-8">
          {formattedPoints.map((day, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-all hover:scale-y-125 relative group/bar",
                day.status === "online" && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]",
                day.status === "offline" && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
                day.status === "partial" && "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
                day.status === "unknown" && "bg-neutral-200 dark:bg-neutral-800"
              )}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 bg-background shadow-2xl border-2 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none scale-95 group-hover/bar:scale-100 backdrop-blur-md">
                <div className="text-[10px] font-black text-muted-foreground/60 leading-none mb-1.5 uppercase tracking-tighter">
                  {format(day.date, type === "daily" ? "MMM dd, yyyy" : "HH:mm 'on' MMM dd")}
                </div>
                <div className={cn(
                  "text-xs font-black uppercase tracking-widest flex items-center gap-1.5",
                  day.status === "online" && "text-green-500",
                  day.status === "offline" && "text-red-500",
                  day.status === "partial" && "text-amber-500"
                )}>
                  <div className={cn("size-1.5 rounded-full shrink-0 animate-pulse", 
                    day.status === "online" ? "bg-green-500" : 
                    day.status === "offline" ? "bg-red-500" : 
                    "bg-amber-500"
                  )} />
                  {day.status}
                </div>
                {day.data && (
                  <div className="mt-1.5 pt-1.5 border-t text-[10px] font-bold text-muted-foreground flex justify-between gap-4">
                    <span>Latency</span>
                    <span className="font-mono text-foreground">{day.data.latency.toFixed(0)}ms</span>
                  </div>
                )}
                {/* Tooltip Caret */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px]">
                  <div className="border-8 border-transparent border-t-background" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-0.5">
          <span>{type === "daily" ? "30 days ago" : "24 hours ago"}</span>
          <span>Now</span>
        </div>
      </div>
    );
  };

  const overallUptime = history.daily.length > 0
    ? (history.daily.reduce((acc, d) => acc + d.up_count, 0) / 
       history.daily.reduce((acc, d) => acc + d.up_count + d.down_count, 0) * 100).toFixed(2)
    : "100.00";

  const avgLatency = (view === "daily" ? history.daily : history.hourly).length > 0
    ? ((view === "daily" ? history.daily : history.hourly).reduce((acc, d) => acc + d.latency, 0) / (view === "daily" ? history.daily : history.hourly).length).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <>
          {!showBoth && (
            <div className="flex justify-center">
              <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl h-9 bg-muted/50 p-1">
                  <TabsTrigger value="hourly" className="rounded-lg text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">24 Hours</TabsTrigger>
                  <TabsTrigger value="daily" className="rounded-lg text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">30 Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-2xl border flex flex-col items-center justify-center text-center">
              <TrendingUp className="text-primary mb-2" size={20} />
              <div className="text-2xl font-black">{overallUptime}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Uptime (30d)</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-2xl border flex flex-col items-center justify-center text-center">
              <Clock className="text-primary mb-2" size={20} />
              <div className="text-2xl font-black">{avgLatency}ms</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Avg Latency ({view === "daily" ? "30d" : "24h"})</div>
            </div>
          </div>
        </>
      )}

      {showBoth ? (
        <div className="space-y-8">
          {renderChart("hourly")}
          {renderChart("daily")}
        </div>
      ) : (
        renderChart(view)
      )}
    </div>
  );
}
