"use client";

import { useEffect, useState } from "react";
import { PhoneLayout } from "@/components/phone-layout";
import { UrbanPulseLogo } from "@/components/icons";
import { getIncidents } from "@/services/incidents";
import type { Incident, IncidentType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const incidentTypeConfig: Record<
  IncidentType,
  { icon: React.ElementType; color: string; label: string }
> = {
  traffic: {
    icon: Car,
    color: "text-destructive",
    label: "Traffic",
  },
  safety: { icon: ShieldAlert, color: "text-accent-foreground", label: "Safety" },
  infrastructure: {
    icon: Construction,
    color: "text-primary",
    label: "Infrastructure",
  },
  road_hazard: {
    icon: CircleAlert,
    color: "text-destructive",
    label: "Road Hazard",
  },
  accident: { icon: Car, color: "text-destructive", label: "Accident" },
  pothole: {
    icon: CircleAlert,
    color: "text-destructive",
    label: "Pothole",
  },
  public_disturbance: {
    icon: ShieldAlert,
    color: "text-accent-foreground",
    label: "Public Disturbance",
  },
};

function AlertCard({ incident }: { incident: Incident }) {
  const config = incidentTypeConfig[incident.type];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className={cn(
          "p-3 flex-row items-center gap-3 space-y-0",
           incident.status === 'active' ? 'bg-destructive/10 border-b border-destructive/20' : 'bg-secondary/50 border-b'
        )}
      >
        <config.icon className={cn("w-6 h-6", config.color)} />
        <div>
          <p className="text-xs text-muted-foreground">{config.label}</p>
          <CardTitle className="text-base font-bold font-headline leading-tight">
            {incident.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 text-sm">
        <p className="text-muted-foreground mb-3 leading-relaxed">
          {incident.description}
        </p>
        <div className="flex justify-between text-xs text-muted-foreground items-center">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDistanceToNow(new Date(incident.timestamp), {
              addSuffix: true,
            })}
          </div>
          <Badge
            variant={incident.status === "active" ? "destructive" : "secondary"}
            className="gap-1.5"
          >
            {incident.status === "active" ? (
              <CircleAlert className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlertsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const fetchedIncidents = await getIncidents();
        const sortedIncidents = [...fetchedIncidents].sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setIncidents(sortedIncidents);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIncidents();
  }, []);

  return (
    <PhoneLayout>
      <header className="sticky top-0 z-20 p-4 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          <UrbanPulseLogo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold font-headline text-foreground">
            Nearby Alerts
          </h1>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto bg-muted/30">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))
          ) : (
            incidents.map((incident) => (
              <AlertCard key={incident.id} incident={incident} />
            ))
          )}
        </div>
      </main>
    </PhoneLayout>
  );
}
