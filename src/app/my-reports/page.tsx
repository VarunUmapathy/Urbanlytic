
"use client";

import { useEffect, useState } from "react";
import { PhoneLayout } from "@/components/phone-layout";
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
  ArchiveX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/firebase/provider";

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

  const getStatusBadge = () => {
    switch(incident.status) {
      case 'active':
        return <Badge variant="destructive" className="gap-1.5"><Pencil className="h-3 w-3" />Active</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="gap-1.5"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
      case 'discarded':
         return <Badge variant="outline" className="gap-1.5"><ArchiveX className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge>{incident.status}</Badge>;
    }
  }

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
          {getStatusBadge()}
        </div>
        <Separator className="my-2" />
        <p className="text-muted-foreground leading-relaxed">
          {incident.description}
        </p>
        {incident.status === 'discarded' && incident.reason && (
          <Alert variant="destructive" className="mt-3">
            <AlertTitle className="font-semibold">Reason for Discard</AlertTitle>
            <AlertDescription>{incident.reason}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyReportsPage() {
  const [myReports, setMyReports] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchMyReports() {
      if (!user) {
        setIsLoading(false);
        return;
      };
      setIsLoading(true);
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
  }, [user]);

  return (
    <PhoneLayout>
      <Header title="My Reports" />

      <main className="flex-grow pt-16 overflow-y-auto">
        <div className="p-4 space-y-4">
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
