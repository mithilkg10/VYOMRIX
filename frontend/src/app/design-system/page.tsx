"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DesignSystemPage() {
  const colors = [
    { name: "Primary", var: "bg-primary text-primary-foreground" },
    { name: "Secondary", var: "bg-secondary text-secondary-foreground" },
    { name: "Accent", var: "bg-accent text-accent-foreground" },
    { name: "Muted", var: "bg-muted text-muted-foreground" },
    { name: "Destructive", var: "bg-destructive text-destructive-foreground" },
    { name: "Success", var: "bg-success text-success-foreground" },
    { name: "Warning", var: "bg-warning text-warning-foreground" },
    { name: "Info", var: "bg-info text-info-foreground" },
  ];

  const surfaces = [
    { name: "Base", var: "bg-surface-base" },
    { name: "Raised", var: "bg-surface-raised" },
    { name: "Elevated", var: "bg-surface-elevated" },
    { name: "Sunken", var: "bg-surface-sunken" },
  ];

  return (
    <div className="container mx-auto py-12 space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-4 gradient-text">SOC Design System</h1>
        <p className="text-muted-foreground text-lg">Centralized tokens and motion primitives for Vyomrix XDR.</p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colors.map((c) => (
            <motion.div whileHover={{ scale: 1.05 }} key={c.name} className={`p-6 rounded-xl flex items-center justify-center font-medium shadow-sm ${c.var}`}>
              {c.name}
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Surfaces (Elevation)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-sunken p-8 rounded-xl border border-border">
          {surfaces.map((s, i) => (
            <div key={s.name} className={`p-8 rounded-xl shadow-md border flex flex-col items-center justify-center ${s.var}`} style={{ zIndex: i }}>
              <span className="font-semibold">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.var}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Typography</h2>
        <div className="space-y-4 panel p-6">
          <h1 className="text-4xl font-bold">Heading 1: Incident Detected</h1>
          <h2 className="text-3xl font-semibold">Heading 2: Threat Analysis</h2>
          <h3 className="text-2xl font-medium">Heading 3: Affected Assets</h3>
          <p className="text-base text-foreground">Body text: The SOC platform has detected an anomaly on workstation-ceo. Immediate isolation is recommended.</p>
          <p className="text-sm text-muted-foreground">Small text: Created at 2026-08-05 14:00 UTC</p>
          <p className="text-xs font-mono text-primary">MONO: 10.0.5.50</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="panel">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Interactive elements with motion.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </CardContent>
          </Card>

          <Card className="panel">
            <CardHeader>
              <CardTitle>Badges & Status</CardTitle>
              <CardDescription>Visual indicators.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Critical</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge className="bg-success text-success-foreground hover:bg-success/80">Resolved</Badge>
              <Badge className="bg-warning text-warning-foreground hover:bg-warning/80">Warning</Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
