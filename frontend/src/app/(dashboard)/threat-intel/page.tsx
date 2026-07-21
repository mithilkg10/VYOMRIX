"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Globe, Shield, Activity, ShieldAlert } from "lucide-react";

export default function ThreatIntelPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setHasSearched(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Threat Intelligence</h1>
        <p className="text-muted-foreground">Unified IOC enrichment via VirusTotal, AbuseIPDB, and AlienVault OTX.</p>
      </div>

      <Card className="shadow-none border-border bg-card">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search IPv4, IPv6, Domain, URL, Hash (MD5, SHA1, SHA256), or CVE..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Analyze IOC</Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 shadow-none border-border">
            <CardHeader>
              <CardTitle>Risk Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 gap-4">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-[8px] border-destructive bg-destructive/10">
                <span className="text-4xl font-bold text-destructive">94</span>
              </div>
              <Badge variant="destructive" className="text-sm px-4 py-1">CRITICAL RISK</Badge>
              <p className="text-sm text-muted-foreground text-center">
                This indicator is highly malicious and associated with known threat actors.
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-none border-border">
            <CardHeader>
              <CardTitle>Provider Analysis</CardTitle>
              <CardDescription>Consolidated reports from {searchQuery}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 rounded-md flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium leading-none">VirusTotal</p>
                      <p className="text-sm text-muted-foreground mt-1">14 / 89 engines detected malicious activity.</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Malicious</Badge>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 rounded-md flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium leading-none">AbuseIPDB</p>
                      <p className="text-sm text-muted-foreground mt-1">Confidence Score: 100%</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Malicious</Badge>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="bg-muted">botnet</Badge>
                  <Badge variant="outline" className="bg-muted">ssh-bruteforce</Badge>
                  <Badge variant="outline" className="bg-muted">mirai</Badge>
                  <Badge variant="outline" className="bg-muted">cve-2024-1234</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-muted/10">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Enter an indicator of compromise to begin enrichment.</p>
        </div>
      )}
    </div>
  );
}
