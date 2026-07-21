"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Target, AlertTriangle, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockTechniques = [
  { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access", coverage: "High", mapped_rules: 2 },
  { id: "T1110", name: "Brute Force", tactic: "Credential Access", coverage: "High", mapped_rules: 4 },
  { id: "T1059.001", name: "PowerShell", tactic: "Execution", coverage: "Medium", mapped_rules: 1 },
  { id: "T1053.005", name: "Scheduled Task", tactic: "Execution, Persistence", coverage: "None", mapped_rules: 0 },
];

export default function MitrePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">MITRE ATT&CK Platform</h1>
        <p className="text-muted-foreground">Interactive coverage navigator mapping SIEM, WAF, Deception, and AI intelligence to the ATT&CK framework.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped Techniques</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">68%</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Gaps</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 pt-4">
             <div className="flex items-center gap-2">
               <AlertTriangle className="h-4 w-4 text-destructive" /> 
               <span className="text-sm font-medium">Persistence (40% Coverage)</span>
             </div>
             <div className="flex items-center gap-2">
               <AlertTriangle className="h-4 w-4 text-warning" /> 
               <span className="text-sm font-medium">Lateral Movement (55% Coverage)</span>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-none border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Technique Coverage Matrix</CardTitle>
            <CardDescription>Enterprise detection rules linked directly to adversarial techniques.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technique</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Tactic(s)</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead className="text-right">Rules</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTechniques.map((tech) => (
                  <TableRow key={tech.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-medium text-primary">{tech.id}</TableCell>
                    <TableCell className="font-medium">{tech.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{tech.tactic}</TableCell>
                    <TableCell>
                      <Badge variant={tech.coverage === 'High' ? 'default' : tech.coverage === 'Medium' ? 'warning' : 'destructive'}>
                        {tech.coverage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{tech.mapped_rules}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader>
            <CardTitle>AI Gap Analysis</CardTitle>
            <CardDescription>Automated recommendations based on coverage gaps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-sm">Critical Gap: T1053.005</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You have 0 rules detecting Scheduled Task creation. This is a common persistence mechanism used by ransomware operators.
              </p>
              <Button size="sm" className="w-full text-xs">
                Auto-Generate Sigma Rule
              </Button>
            </div>
            
            <div className="rounded-md border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Strong Coverage: T1190</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your internet-facing assets (prod-web-01) are heavily protected against Public-Facing Application exploits via WAF and Wazuh rules.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
