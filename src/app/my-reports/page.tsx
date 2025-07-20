"use client";

import { useEffect, useState } from "react";
import { PhoneLayout } from "@/components/phone-layout";
import { UrbanPulseLogo } from "@/components/icons";
import { getUserReports } from "@/services/incidents";
import type { Incident, IncidentType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Construction,
  ShieldAlert,
  Clock,
  CircleAlert,
  CheckCircle,
  Pencil,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const incidentTypeConfig: Record<
  IncidentType,
  { icon: React.ElementType; color: string; label: string }
> = {
  traffic: {
    icon: Car,
    color: "text-destructive",
    label: "Traffic Incident",
  },
  safety: {
    icon: ShieldAlert,
    color: "text-accent-foreground",
    label: "Safety Concern",
  },
  infrastructure: {
    icon: Construction,
    color: "text-primary",
    label: "Infrastructure Issue",
  },
  road_hazard: {
    icon: CircleAlert,
    color: "text-destructive",
    label: "Road Hazard",
  },
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
  accident: { icon: Car, color: "text-destructive", label: "Accident" },
};

function ReportItem({ incident }: { incident: Incident }) {
  const config = incidentTypeConfig[incident.type] || incidentTypeConfig['infrastructure'];

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <config.icon className={cn("w-5 h-5", config.color)} />
          <CardTitle className="text-base font-bold font-headline leading-tight">
            {incident.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-sm">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
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
              <Pencil className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </Badge>
        </div>
        <Separator className="my-2" />
        <p className="text-muted-foreground leading-relaxed">
          {incident.description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function MyReportsPage() {
  const [myReports, setMyReports] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMyReports() {
      try {
        const fetchedIncidents = await getUserReports();
        setMyReports(fetchedIncidents);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMyReports();
  }, []);

  return (
    <PhoneLayout>
      <header className="sticky top-0 z-20 p-4 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          <UrbanPulseLogo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold font-headline text-foreground">
            My Reports
          </h1>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))
          ) : myReports.length > 0 ? (
            myReports.map((report) => (
              <ReportItem key={report.id} incident={report} />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>You haven't submitted any reports yet.</p>
            </div>
          )}
        </div>
      </main>
    </PhoneLayout>
  );
}
