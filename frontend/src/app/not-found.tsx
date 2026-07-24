"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPinOff, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-8 text-center bg-background">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <MapPinOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">404 - Endpoint Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        The requested resource or page does not exist on this server. It may have been moved or removed.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
