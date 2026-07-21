"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Monitor, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockAgents = [
  { id: "000", name: "vyomrix-server", ip: "127.0.0.1", os: "Ubuntu 22.04", status: "active", lastSeen: "Just now" },
  { id: "001", name: "win-desktop-01", ip: "192.168.1.105", os: "Windows 11", status: "disconnected", lastSeen: "2 hours ago" },
  { id: "002", name: "web-server-02", ip: "10.0.0.50", os: "Debian 12", status: "active", lastSeen: "1m ago" },
  { id: "003", name: "win-dc-01", ip: "10.0.0.10", os: "Windows Server 2022", status: "active", lastSeen: "5m ago" },
];

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Monitored Agents</h1>
        <p className="text-muted-foreground">Manage endpoints and servers monitored by Wazuh.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <ShieldCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">3</div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">1</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Endpoint Inventory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search agents..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAgents.map((agent) => (
                  <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{agent.id}</TableCell>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="font-mono text-xs">{agent.ip}</TableCell>
                    <TableCell>{agent.os}</TableCell>
                    <TableCell>
                      <Badge variant={agent.status === 'active' ? 'default' : 'destructive'} className={agent.status === 'active' ? 'bg-success hover:bg-success/80' : ''}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{agent.lastSeen}</TableCell>
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
