"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, ShieldAlert, Cpu, Activity, Lightbulb } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  structuredData?: any;
}

export default function AISocPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hello. I am the Vyomrix AI SOC Analyst. How can I assist you with investigations today?"
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages([...messages, newUserMsg]);
    setInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "I have analyzed the provided alert. Here is the structured breakdown.",
        structuredData: {
          summary: "Suspicious PowerShell execution bypassing execution policy.",
          risk_level: "High",
          mitre_attack: ["T1059.001 - PowerShell"],
          recommended_actions: [
            "Isolate the endpoint from the network.",
            "Review PowerShell script block logs (Event ID 4104).",
            "Check for recent changes to scheduled tasks."
          ]
        }
      }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">AI Security Analyst</h1>
        <p className="text-muted-foreground">Autonomous threat investigation and alert triage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Context Panel (Left) */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <Card className="shadow-none border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Active Context</CardTitle>
              <CardDescription>Data currently loaded into the AI context window.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3 flex flex-col gap-2 bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Alert ID: 91802
                </div>
                <p className="text-xs text-muted-foreground">Suspicious PowerShell Execution Detected</p>
                <Badge variant="destructive" className="w-fit text-[10px]">Level 12</Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick Actions</p>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Cpu className="h-4 w-4 mr-2" /> Explain this alert
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Activity className="h-4 w-4 mr-2" /> Map to MITRE ATT&CK
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Lightbulb className="h-4 w-4 mr-2" /> Suggest Remediation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface (Right) */}
        <Card className="md:col-span-3 shadow-none border-border flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm ${msg.role === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                    {msg.role === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  
                  <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className="rounded-lg border px-4 py-3 bg-card text-sm shadow-sm">
                      {msg.content}
                    </div>
                    
                    {msg.structuredData && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4 w-full">
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Summary</h4>
                          <p className="text-sm text-muted-foreground">{msg.structuredData.summary}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant={msg.structuredData.risk_level === 'High' ? 'destructive' : 'secondary'}>
                            Risk: {msg.structuredData.risk_level}
                          </Badge>
                          {msg.structuredData.mitre_attack?.map((t: string) => (
                            <Badge key={t} variant="outline" className="font-mono text-xs">{t}</Badge>
                          ))}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Recommended Actions</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {msg.structuredData.recommended_actions?.map((act: string, i: number) => (
                              <li key={i}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-card">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                placeholder="Ask the AI Analyst..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

      </div>
    </div>
  );
}
