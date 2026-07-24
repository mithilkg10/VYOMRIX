import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">Vyomrix</span>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
      <div className="absolute bottom-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Vyomrix Security. All rights reserved.
        </p>
      </div>
    </div>
  );
}
