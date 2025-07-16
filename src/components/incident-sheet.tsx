"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Incident, IncidentType } from "@/lib/types";
import {
  Car,
  Construction,
  ShieldAlert,
  Clock,
  CircleAlert,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const incidentTypeConfig: Record<
  IncidentType,
  { icon: React.ElementType; color: string; label: string }
> = {
  traffic: {
    icon: Car,
    color: "text-destructive",
    label: "Traffic Incident",
  },
  safety: { icon: ShieldAlert, color: "text-accent", label: "Safety Concern" },
  infrastructure: {
    icon: Construction,
    color: "text-primary",
    label: "Infrastructure Issue",
  },
};

export function IncidentSheet({
  incident,
  open,
  onOpenChange,
}: {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!incident) return null;

  const config = incidentTypeConfig[incident.type];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80svh]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-3">
            <config.icon className={cn("w-6 h-6", config.color)} />
            <span className="text-xl font-bold font-headline">
              {config.label}
            </span>
          </SheetTitle>
          <SheetDescription>{incident.title}</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4 overflow-y-auto">
          <Separator />
          <div className="flex justify-around text-center">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={incident.status === "active" ? "destructive" : "secondary"}
                className="mt-1 gap-1.5"
              >
                {incident.status === "active" ? (
                  <CircleAlert className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                {incident.status.charAt(0).toUpperCase() +
                  incident.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Severity</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {incident.severity}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reported</p>
              <p className="font-semibold flex items-center gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDistanceToNow(new Date(incident.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Details</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {incident.description}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
