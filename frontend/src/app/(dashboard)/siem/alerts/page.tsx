"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockAlerts = [
  { id: "mock-1", title: "Suspicious PowerShell Execution Detected", severity: 12, agent: "win-desktop-01", mitre: "T1059.001", time: "10m ago" },
  { id: "mock-2", title: "Multiple SSH Authentication Failures", severity: 8, agent: "vyomrix-server", mitre: "T1110.001", time: "1h ago" },
  { id: "mock-3", title: "Web Shell Activity Detected", severity: 14, agent: "web-server-02", mitre: "T1505.003", time: "3h ago" },
  { id: "mock-4", title: "User Added to Local Administrators", severity: 9, agent: "win-dc-01", mitre: "T1098", time: "5h ago" },
  { id: "mock-5", title: "Nmap Scan Detected", severity: 4, agent: "vyomrix-firewall", mitre: "T1046", time: "1d ago" },
];

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">SIEM Alerts</h1>
        <p className="text-muted-foreground">Monitor and investigate normalized security events from Wazuh.</p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Security Events</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search alerts..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>MITRE Tactic</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAlerts.map((alert) => (
                  <TableRow key={alert.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Badge 
                        variant={alert.severity >= 12 ? 'destructive' : alert.severity >= 8 ? 'warning' : 'secondary'}
                      >
                        Level {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell>{alert.agent}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {alert.mitre}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{alert.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
