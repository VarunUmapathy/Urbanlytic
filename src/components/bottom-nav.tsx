"use client";

import { LayoutGrid, ListChecks, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: LayoutGrid, notificationCount: 0 },
    { name: "My Reports", href: "/my-reports", icon: ListChecks, notificationCount: 0 },
    { name: "Alerts", href: "/alerts", icon: Bell, notificationCount: 3 },
    { name: "Profile", href: "/login", icon: User, notificationCount: 0 },
  ];
  
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border/50 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Button
            key={item.name}
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-full text-muted-foreground p-2 gap-1 rounded-none w-full",
              isActive && "text-primary"
            )}
            asChild
          >
            <Link href={item.href}>
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-2 h-4 w-4 justify-center p-0 text-[10px]"
                  >
                    {item.notificationCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.name}</span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
