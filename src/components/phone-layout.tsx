"use client";

import { BottomNav } from "@/components/bottom-nav";

export function PhoneLayout({
  children,
  showBottomNav = true,
}: {
  children: React.ReactNode;
  showBottomNav?: boolean;
}) {
  return (
    <div className="bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-background rounded-[40px] shadow-2xl border-8 border-neutral-900 overflow-hidden relative flex flex-col">
        {children}
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
