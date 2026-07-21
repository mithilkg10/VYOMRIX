"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Clock, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockIncidents = [
  { id: "INC-2026-001", title: "Correlated Attack Campaign: Mirai Botnet -> SQL Injection", severity: "Critical", status: "In Progress", analyst: "Alice", time: "15m ago" },
  { id: "INC-2026-002", title: "Suspicious PowerShell Encoding", severity: "High", status: "Open", analyst: "Unassigned", time: "2h ago" },
  { id: "INC-2026-003", title: "Multiple Failed Logins (Internal)", severity: "Medium", status: "Resolved", analyst: "Bob", time: "1d ago" },
];

export default function IncidentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Incident Response</h1>
        <p className="text-muted-foreground">Manage active investigations, track evidence timelines, and execute AI-assisted playbooks.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTD</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4m 12s</div>
            <p className="text-xs text-muted-foreground">-12% from last week</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45m 30s</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contained / Resolved</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">14</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Case Management</CardTitle>
            <CardDescription>Active and recently closed security investigations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Analyst</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockIncidents.map((inc) => (
                  <TableRow key={inc.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-medium">{inc.id}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{inc.title}</TableCell>
                    <TableCell>
                      <Badge variant={inc.severity === 'Critical' || inc.severity === 'High' ? 'destructive' : 'warning'}>
                        {inc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inc.status === 'Resolved' ? 'secondary' : 'default'}>
                        {inc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inc.analyst}</TableCell>
                    <TableCell className="text-right text-xs">{inc.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border bg-muted/20">
          <CardHeader>
            <CardTitle>AI Incident Advisor</CardTitle>
            <CardDescription>Selected Incident: INC-2026-001</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Executive Summary</h4>
              <p className="text-xs text-muted-foreground">
                High-confidence attack. The attacker enumerated the honeypot before pivoting to target the application layer of the production server. The WAF successfully blocked the intrusion.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Recommended Containment</h4>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                <li>Block IP 185.15.22.1 on edge firewall.</li>
                <li>Rotate SSH keys on the honeypot if necessary.</li>
                <li>Review web application logs for bypass attempts.</li>
              </ul>
            </div>
            <Button size="sm" className="w-full">
              Execute Playbook
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
