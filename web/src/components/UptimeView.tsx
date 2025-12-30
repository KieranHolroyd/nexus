import { apiFetch } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

interface HealthPoint {
  timestamp: string;
  up_count: number;
  down_count: number;
  latency: number;
}

interface UptimeHistory {
  service_id: string;
  hourly: HealthPoint[];
  daily: HealthPoint[];
}

interface UptimeViewProps {
  serviceId: string;
}

export function UptimeView({ serviceId }: UptimeViewProps) {
  const { data: history, isLoading: loading, error } = useQuery<UptimeHistory>({
    queryKey: ["uptime", serviceId],
    queryFn: async () => {
      const res = await apiFetch(`/api/services/${serviceId}/uptime`);
      if (!res.ok) throw new Error("Failed to fetch uptime history");
      return res.json();
    },
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

  // Calculate 30-day status
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const date = startOfDay(subDays(new Date(), 29 - i));
    const dayData = history.daily.find((d) => isSameDay(new Date(d.timestamp), date));
    
    let status: "online" | "offline" | "partial" | "unknown" = "unknown";
    if (dayData) {
      if (dayData.down_count === 0 && dayData.up_count > 0) status = "online";
      else if (dayData.up_count === 0 && dayData.down_count > 0) status = "offline";
      else if (dayData.up_count > 0 && dayData.down_count > 0) status = "partial";
    }
    
    return { date, status, data: dayData };
  });

  const overallUptime = history.daily.length > 0
    ? (history.daily.reduce((acc, d) => acc + d.up_count, 0) / 
       history.daily.reduce((acc, d) => acc + d.up_count + d.down_count, 0) * 100).toFixed(2)
    : "100.00";

  const avgLatency = history.hourly.length > 0
    ? (history.hourly.reduce((acc, d) => acc + d.latency, 0) / history.hourly.length).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 p-4 rounded-2xl border flex flex-col items-center justify-center text-center">
          <TrendingUp className="text-primary mb-2" size={20} />
          <div className="text-2xl font-black">{overallUptime}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Uptime (30d)</div>
        </div>
        <div className="bg-muted/30 p-4 rounded-2xl border flex flex-col items-center justify-center text-center">
          <Clock className="text-primary mb-2" size={20} />
          <div className="text-2xl font-black">{avgLatency}ms</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Avg Latency</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last 30 Days</h4>
          <span className="text-[10px] font-medium text-green-500">100% Uptime</span>
        </div>
        <div className="flex gap-1 h-8">
          {last30Days.map((day, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-all hover:scale-y-125 relative group",
                day.status === "online" && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]",
                day.status === "offline" && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
                day.status === "partial" && "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
                day.status === "unknown" && "bg-neutral-200 dark:bg-neutral-800"
              )}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-popover text-popover-foreground text-[10px] rounded shadowing-xl border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                <div className="font-bold">{format(day.date, "MMM dd, yyyy")}</div>
                <div className={cn(
                  "font-black uppercase mt-1",
                  day.status === "online" && "text-green-500",
                  day.status === "offline" && "text-red-500",
                  day.status === "partial" && "text-amber-500"
                )}>
                  {day.status}
                </div>
                {day.data && (
                  <div className="mt-1 opacity-70">
                    Latency: {day.data.latency.toFixed(0)}ms
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-0.5">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
