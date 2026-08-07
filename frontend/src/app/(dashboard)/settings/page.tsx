"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Laptop, Smartphone, Globe, ShieldAlert, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: authApi.getSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      toast.success("Session revoked successfully.");
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
    }
  });

  const revokeAllMutation = useMutation({
    mutationFn: authApi.revokeAllSessions,
    onSuccess: () => {
      toast.success("All other sessions revoked.");
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
    }
  });

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return <Smartphone className="h-5 w-5" />;
    if (ua.includes("mac") || ua.includes("windows") || ua.includes("linux")) return <Laptop className="h-5 w-5" />;
    return <Globe className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your platform preferences and security.</p>
      </div>

      <Card className="panel border-destructive/20">
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Active Sessions
            </CardTitle>
            <CardDescription className="mt-1">
              Manage devices currently signed into your account.
            </CardDescription>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              if (window.confirm("Are you sure you want to revoke all other sessions? You will remain logged in here.")) {
                revokeAllMutation.mutate();
              }
            }}
            disabled={revokeAllMutation.isPending || isLoading}
          >
            Revoke All Other Sessions
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading sessions...</div>
            ) : sessions?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No active sessions found.</div>
            ) : (
              sessions?.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-surface-base">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-surface-sunken rounded-full text-muted-foreground shrink-0">
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.ip_address}</p>
                        {session.is_current && <Badge className="bg-success text-success-foreground">Current Session</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground max-w-[300px] sm:max-w-md truncate" title={session.user_agent}>
                        {session.user_agent}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last active: {formatDistanceToNow(new Date(session.last_used_at), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created: {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  {!session.is_current && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 sm:mt-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm("Revoke this session?")) {
                          revokeMutation.mutate(session.id);
                        }
                      }}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
