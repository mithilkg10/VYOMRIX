"use client";

import { MotionConfig } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Respect user OS motion preferences globally
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
