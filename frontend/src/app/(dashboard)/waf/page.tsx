"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ShieldAlert, Globe, Code, FileDigit } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockWafEvents = [
  { id: "waf-1", type: "SQL Injection", target: "juiceshop (/rest/user/login)", src: "185.15.22.1", action: "Blocked", time: "1m ago" },
  { id: "waf-2", type: "Cross-Site Scripting (XSS)", target: "juiceshop (/search?q=)", src: "10.0.0.50", action: "Blocked", time: "5m ago" },
  { id: "waf-3", type: "Path Traversal", target: "juiceshop (/public/images/..)", src: "8.8.8.8", action: "Blocked", time: "1h ago" },
  { id: "waf-4", type: "Rate Limit Exceeded", target: "dvwa (/login.php)", src: "192.168.1.100", action: "Throttled", time: "2h ago" },
];

export default function WafPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Application Security</h1>
        <p className="text-muted-foreground">Monitor and correlate Layer 7 attacks blocked by the Web Application Firewall.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Apps</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">juiceshop, dvwa</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">8,542</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OWASP Top 10 Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 pt-4">
             <div className="flex items-center gap-2">
               <FileDigit className="h-4 w-4 text-muted-foreground" /> 
               <span className="text-sm font-medium">Injection (55%)</span>
             </div>
             <div className="flex items-center gap-2">
               <Code className="h-4 w-4 text-muted-foreground" /> 
               <span className="text-sm font-medium">XSS (25%)</span>
             </div>
             <div className="flex items-center gap-2">
               <Globe className="h-4 w-4 text-muted-foreground" /> 
               <span className="text-sm font-medium">Broken Auth (20%)</span>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Live WAF Attack Feed</CardTitle>
            <CardDescription>Real-time attacks normalized from ModSecurity / SafeLine.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attack Type</TableHead>
                  <TableHead>Target URI</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockWafEvents.map((evt) => (
                  <TableRow key={evt.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{evt.type}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{evt.target}</TableCell>
                    <TableCell>{evt.src}</TableCell>
                    <TableCell>
                      <Badge variant={evt.action === 'Blocked' ? 'destructive' : 'warning'}>
                        {evt.action}
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
            <CardTitle>Cross-Domain Correlation</CardTitle>
            <CardDescription>AI-driven correlation across WAF, Deception, and TI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive">CRITICAL</Badge>
                <span className="font-semibold text-sm">Correlated Attack Pattern</span>
              </div>
              <div className="text-sm text-muted-foreground mb-4 space-y-2">
                <p><strong>1.</strong> The IP <code>185.15.22.1</code> was detected brute-forcing the OpenCanary SSH honeypot at 02:00.</p>
                <p><strong>2.</strong> Threat Intel flags this IP as a known initial access broker.</p>
                <p><strong>3.</strong> At 02:15, the same IP executed a SQL Injection against <code>juiceshop (/rest/user/login)</code>.</p>
              </div>
              <Button size="sm" className="w-full text-xs">
                Create Incident Case
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
