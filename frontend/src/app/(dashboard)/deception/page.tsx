"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, ShieldAlert, FileKey, Terminal, Globe, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockDeceptionEvents = [
  { id: "evt-1", service: "ssh", src: "185.15.22.1", action: "Login Attempt (root:password123)", time: "2m ago", threat: "High" },
  { id: "evt-2", service: "smb", src: "10.0.0.45", action: "Enumeration (IPC$ connect)", time: "15m ago", threat: "Medium" },
  { id: "evt-3", service: "ftp", src: "8.8.8.8", action: "Anonymous Login Success", time: "1h ago", threat: "Low" },
  { id: "evt-4", service: "http", src: "192.168.1.100", action: "GET /admin/config.php", time: "3h ago", threat: "Medium" },
];

export default function DeceptionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Deception Platform</h1>
        <p className="text-muted-foreground">Monitor interactions with OpenCanary honeypots across the network.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Honeypots</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">vyomrix-honeypot-01</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Targeted Services</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 pt-4">
             <div className="flex items-center gap-2">
               <Terminal className="h-4 w-4 text-muted-foreground" /> 
               <span className="text-sm font-medium">SSH (45%)</span>
             </div>
             <div className="flex items-center gap-2">
               <FileKey className="h-4 w-4 text-muted-foreground" /> 
               <span className="text-sm font-medium">SMB (30%)</span>
             </div>
             <div className="flex items-center gap-2">
               <Globe className="h-4 w-4 text-muted-foreground" /> 
               <span className="text-sm font-medium">HTTP (25%)</span>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Live Attack Feed</CardTitle>
            <CardDescription>Real-time interactions normalized from raw OpenCanary logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Interaction Details</TableHead>
                  <TableHead>Threat</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDeceptionEvents.map((evt) => (
                  <TableRow key={evt.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs uppercase">{evt.service}</TableCell>
                    <TableCell className="font-medium">{evt.src}</TableCell>
                    <TableCell className="text-muted-foreground">{evt.action}</TableCell>
                    <TableCell>
                      <Badge variant={evt.threat === 'High' ? 'destructive' : evt.threat === 'Medium' ? 'warning' : 'secondary'}>
                        {evt.threat}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{evt.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Automated triage of deception events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">SSH Brute Force Campaign</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The IP 185.15.22.1 has attempted 40+ logins over the past hour. TI enrichment flags this IP as a known Mirai botnet node.
              </p>
              <Button size="sm" variant="outline" className="w-full text-xs">
                View Full AI Report
              </Button>
            </div>
            
            <div className="rounded-md border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Internal Reconnaissance</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Internal IP 10.0.0.45 is enumerating SMB shares on the honeypot. This suggests potential lateral movement.
              </p>
              <Button size="sm" variant="outline" className="w-full text-xs">
                Isolate Host (SOAR)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
