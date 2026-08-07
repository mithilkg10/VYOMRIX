"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type Incident } from "@/lib/api/incidents";
import { type SiemAlert } from "@/lib/api/siem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SEVERITY_COLORS = {
  Critical: "hsl(var(--destructive))",
  High: "#f97316", // orange-500
  Medium: "#f59e0b", // amber-500
  Low: "#3b82f6", // blue-500
};

export function SeverityDistribution({ incidents, alerts }: { incidents: Incident[]; alerts: SiemAlert[] }) {
  const data = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    
    // Process incidents
    incidents.forEach((inc) => {
      if (counts[inc.severity] !== undefined) {
        counts[inc.severity]++;
      }
    });

    // Process alerts (assuming level >= 10 is Critical, 7-9 is High, 4-6 is Medium, 1-3 is Low)
    alerts.forEach((alert) => {
      if (alert.severity >= 10) counts.Critical++;
      else if (alert.severity >= 7) counts.High++;
      else if (alert.severity >= 4) counts.Medium++;
      else counts.Low++;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents, alerts]);

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Severity Distribution</CardTitle>
        <CardDescription>Consolidated view of incidents and SIEM alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.Medium} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
          {data.map((item) => (
            <div key={item.name} className="flex flex-col items-center">
              <div 
                className="mb-1 h-3 w-3 rounded-full" 
                style={{ backgroundColor: SEVERITY_COLORS[item.name as keyof typeof SEVERITY_COLORS] }} 
              />
              <span>{item.name}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AlertActivity({ alerts }: { alerts: SiemAlert[] }) {
  const data = useMemo(() => {
    // Group alerts by hour for the last 24 hours
    const now = new Date();
    const last24h = Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now);
      d.setHours(d.getHours() - (23 - i));
      return {
        timestamp: d.getTime(),
        label: `${d.getHours()}:00`,
        High: 0,
        Medium: 0,
        Low: 0
      };
    });

    alerts.forEach(alert => {
      const alertTime = new Date(alert.timestamp).getTime();
      const hourDiff = Math.floor((now.getTime() - alertTime) / (1000 * 60 * 60));
      
      if (hourDiff >= 0 && hourDiff < 24) {
        const binIndex = 23 - hourDiff;
        if (alert.severity >= 7) last24h[binIndex].High++;
        else if (alert.severity >= 4) last24h[binIndex].Medium++;
        else last24h[binIndex].Low++;
      }
    });

    return last24h;
  }, [alerts]);

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Threat Activity</CardTitle>
        <CardDescription>Alert volume over the last 24 hours.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} minTickGap={20} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
              />
              <Bar dataKey="High" stackId="a" fill={SEVERITY_COLORS.High} radius={[0, 0, 4, 4]} />
              <Bar dataKey="Medium" stackId="a" fill={SEVERITY_COLORS.Medium} />
              <Bar dataKey="Low" stackId="a" fill={SEVERITY_COLORS.Low} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function calculateMTTC(incidents: Incident[]): string {
  const resolved = incidents.filter(i => (i.status === 'Resolved' || i.status === 'Closed') && i.closed_at);
  if (resolved.length === 0) return "N/A";
  
  const totalMs = resolved.reduce((acc, curr) => {
    return acc + (new Date(curr.closed_at!).getTime() - new Date(curr.created_at).getTime());
  }, 0);
  
  const avgMs = totalMs / resolved.length;
  
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
