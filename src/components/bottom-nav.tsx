"use client";

import { LayoutGrid, ListChecks, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", icon: LayoutGrid, active: true },
  { name: "My Reports", icon: ListChecks, active: false },
  { name: "Alerts", icon: Bell, active: false, notificationCount: 3 },
  { name: "Profile", icon: User, active: false },
];

export function BottomNav() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border/50 flex justify-around items-center">
      {navItems.map((item) => (
        <Button
          key={item.name}
          variant="ghost"
          className={cn(
            "flex flex-col items-center justify-center h-full text-muted-foreground p-2 gap-1 rounded-none w-full",
            item.active && "text-primary"
          )}
        >
          <div className="relative">
            <item.icon className="w-6 h-6" />
            {item.notificationCount && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-2 h-4 w-4 justify-center p-0 text-[10px]"
              >
                {item.notificationCount}
              </Badge>
            )}
          </div>
          <span className="text-xs">{item.name}</span>
        </Button>
      ))}
    </div>
  );
}
