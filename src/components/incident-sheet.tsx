"use client";

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
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

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
  if (!incident || !open) return null;

  const config = incidentTypeConfig[incident.type];

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 bg-black/40 transition-opacity",
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-40 transform transition-transform ease-out duration-300 bg-background rounded-t-2xl p-4 shadow-lg max-h-[80svh] flex flex-col",
          open ? "translate-y-0" : "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <config.icon className={cn("w-6 h-6", config.color)} />
            <span className="text-xl font-bold font-headline">
              {config.label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm pl-9 -mt-2 mb-2">
          {incident.title}
        </p>

        <div className="py-4 space-y-4 overflow-y-auto flex-grow">
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
              <p className="font-semibold flex items-center gap-1.5 mt-1 text-sm">
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
      </div>
    </div>
  );
}
