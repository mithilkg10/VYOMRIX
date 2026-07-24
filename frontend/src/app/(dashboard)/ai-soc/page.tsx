"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Trash2, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const INITIAL_GREETING = "Hello. I am the MKG AI SOC Analyst. How can I assist you with threat investigations today?";

export default function AISocPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: INITIAL_GREETING,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleClearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: "ai",
      content: INITIAL_GREETING,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const newUserMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsTyping(true);
    
    // Simulate streaming response
    const mockResponse = `I have analyzed the provided context.

### Executive Summary
High-confidence attack detected. The attacker enumerated the honeypot before pivoting to target the application layer.

**Recommended Actions:**
1. Block IP \`185.15.22.1\` on edge firewall.
2. Rotate SSH keys on the honeypot.
3. Review web application logs.

Here is a query you can run to investigate further:
\`\`\`sql
SELECT * FROM access_logs 
WHERE ip_address = '185.15.22.1' 
ORDER BY timestamp DESC;
\`\`\`

Let me know if you want me to execute the remediation playbook.`;

    let currentIndex = 0;
    const streamId = (Date.now() + 1).toString();
    
    setMessages(prev => [...prev, {
      id: streamId,
      role: "ai",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    const interval = setInterval(() => {
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg.id === streamId) {
          lastMsg.content = mockResponse.slice(0, currentIndex + 5);
        }
        return newMsgs;
      });
      currentIndex += 5;
      
      if (currentIndex >= mockResponse.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 50);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Security Analyst</h1>
          <p className="text-muted-foreground text-sm mt-1">Autonomous threat investigation and alert triage.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearChat} className="text-muted-foreground">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col mt-6 shadow-none border-border overflow-hidden bg-background">
        
        {/* Scrollable Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto w-full ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'ai' && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              
              <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  {msg.role === 'ai' ? 'MKG AI SOC' : 'You'}
                  <span className="flex items-center"><Clock className="h-3 w-3 mr-1"/>{msg.timestamp}</span>
                </div>
                
                <div className={`rounded-lg px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted/50 border'
                }`}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                {...props}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md border text-xs my-2"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code {...props} className="bg-primary/20 text-primary rounded px-1 py-0.5 font-mono text-xs">
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-secondary text-secondary-foreground shadow-sm mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && messages[messages.length - 1].role === 'user' && (
             <div className="flex gap-4 max-w-4xl mx-auto w-full">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm mt-1">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted/50 border rounded-lg px-4 py-4 shadow-sm flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="p-4 bg-background border-t">
          <form 
            onSubmit={handleSend} 
            className="flex max-w-4xl mx-auto gap-3 items-end bg-muted/30 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-primary shadow-sm transition-all"
          >
            <Input 
              placeholder="Message the AI SOC Analyst... (e.g., 'Analyze alert 91802')" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base py-6 px-4"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isTyping} 
              className="h-10 w-10 shrink-0 rounded-lg mb-1 mr-1"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">AI can make mistakes. Verify important security actions.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
