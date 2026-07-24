"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-8 text-center bg-background">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-3xl font-semibold tracking-tight mb-2">System Error Detected</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        An unexpected error occurred in the platform. This event has been logged for analysis.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Attempt Recovery
        </Button>
      </div>
    </div>
  );
}
