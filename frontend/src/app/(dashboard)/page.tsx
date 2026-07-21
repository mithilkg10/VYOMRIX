"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldAlert, Brain, Server } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Security Overview</h1>
        <p className="text-muted-foreground">Monitor and respond to threats across your environment.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">84/100</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive font-medium">+14%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success font-medium">-5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">
              Actionable recommendations
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Assets</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">
              4 critical assets offline
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart Placeholder */}
        <Card className="col-span-4 shadow-none border-border">
          <CardHeader>
            <CardTitle>Attack Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed m-4 rounded">
            <p className="text-muted-foreground text-sm">Interactive Chart Component (Recharts)</p>
          </CardContent>
        </Card>

        {/* Recent Incidents List */}
        <Card className="col-span-3 shadow-none border-border">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Multiple Failed Logins", source: "Auth0", severity: "High", time: "10m ago" },
                { title: "Suspicious PowerShell Execution", source: "Wazuh", severity: "Critical", time: "1h ago" },
                { title: "SQL Injection Attempt", source: "WAF", severity: "Medium", time: "3h ago" },
                { title: "Honeypot SSH Connection", source: "OpenCanary", severity: "Low", time: "5h ago" },
              ].map((incident, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">Detected by {incident.source} • {incident.time}</p>
                  </div>
                  <Badge variant={incident.severity === 'Critical' ? 'destructive' : 'secondary'} className="rounded-sm">
                    {incident.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
