"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Code2, PlayCircle, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockRules = [
  { id: "1111-2222-3333", title: "Suspicious PowerShell Execution", author: "Vyomrix SOC", severity: "High", status: "Active", mitre: ["T1059.001"] },
  { id: "4444-5555-6666", title: "Potential SQL Injection", author: "Vyomrix SOC", severity: "Critical", status: "Active", mitre: ["T1190"] },
  { id: "7777-8888-9999", title: "Unusual Scheduled Task Creation", author: "Vyomrix SOC", severity: "Medium", status: "Testing", mitre: ["T1053.005"] },
];

export default function DetectionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Detection Engineering</h1>
        <p className="text-muted-foreground">Manage Sigma rules, validate detection logic, and test against sample logs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Code2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">130</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 pt-4">
             <Button variant="outline" size="sm"><Code2 className="mr-2 h-4 w-4"/> Create Rule</Button>
             <Button variant="outline" size="sm"><PlayCircle className="mr-2 h-4 w-4"/> Testing Lab</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle>Sigma Rule Library</CardTitle>
          <CardDescription>All custom detection rules parsed and validated by the backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Title</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ATT&CK</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRules.map((rule) => (
                <TableRow key={rule.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{rule.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{rule.id}</TableCell>
                  <TableCell>
                    <Badge variant={rule.severity === 'Critical' || rule.severity === 'High' ? 'destructive' : 'warning'}>
                      {rule.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.status === 'Active' ? 'default' : 'secondary'}>
                      {rule.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {rule.mitre.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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
