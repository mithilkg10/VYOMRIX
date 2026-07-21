"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Server, Shield, Cloud, Activity } from "lucide-react";

const mockAssets = [
  { id: "ast-1001", hostname: "prod-web-01", ip: "192.168.1.100", type: "Server", env: "Production", crit: "High", tags: ["pci-dss", "frontend"], waf: true, wazuh: true },
  { id: "ast-1002", hostname: "vyomrix-honeypot-01", ip: "10.0.0.50", type: "Honeypot", env: "Production", crit: "Low", tags: ["deception", "internal"], waf: false, wazuh: false },
  { id: "ast-1003", hostname: "db-primary-cluster", ip: "10.0.0.80", type: "Server", env: "Production", crit: "Critical", tags: ["pii", "database"], waf: false, wazuh: true },
];

export default function AssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Asset Intelligence</h1>
        <p className="text-muted-foreground">The contextual backbone of Vyomrix. Manage and map security coverage across your infrastructure.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Assets</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">1</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wazuh Coverage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">66%</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internet Facing</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>Global view of all tracked entities and their security posture.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Security Coverage</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAssets.map((ast) => (
                <TableRow key={ast.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{ast.hostname}</TableCell>
                  <TableCell className="font-mono text-xs">{ast.ip}</TableCell>
                  <TableCell>{ast.type}</TableCell>
                  <TableCell>
                    <Badge variant={ast.crit === 'Critical' || ast.crit === 'High' ? 'destructive' : 'secondary'}>
                      {ast.crit}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {ast.wazuh ? <Badge variant="outline" className="border-green-500 text-green-600">EDR</Badge> : null}
                    {ast.waf ? <Badge variant="outline" className="border-blue-500 text-blue-600">WAF</Badge> : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ast.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
