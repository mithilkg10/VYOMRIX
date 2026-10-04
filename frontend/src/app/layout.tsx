import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { CommandPalette } from "@/components/command-palette";

export const metadata: Metadata = {
  title: {
    default: "VYOMRIX | Security Operations Platform",
    template: "%s | VYOMRIX",
  },
  description: "Security operations engineering platform for SIEM telemetry, detection review, incident investigation, ATT&CK context and reporting.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <MotionProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              {children}
              <CommandPalette />
              <Toaster />
            </ThemeProvider>
          </MotionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
