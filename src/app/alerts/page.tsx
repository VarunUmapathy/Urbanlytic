
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PhoneLayout } from "@/components/phone-layout";
import { getIncidents, getNewsArticles } from "@/services/incidents";
import type { Incident, IncidentType, NewsArticle, AlertItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Construction,
  ShieldAlert,
  Clock,
  CircleAlert,
  CheckCircle,
  ImageOff,
  Newspaper,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from 'next/link';

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
    <Collapsible>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full text-left">
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
        </CollapsibleTrigger>
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
        <CollapsibleContent>
          <div className="border-t">
            {incident.imageUrl ? (
              <div className="relative aspect-video w-full">
                <Image
                  src={incident.imageUrl}
                  alt={incident.title}
                  fill
                  objectFit="cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 bg-muted/50 text-muted-foreground text-sm">
                <ImageOff className="w-6 h-6 mb-2" />
                <p>No image available for this incident.</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer">
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
        <CardHeader className="p-3 space-y-0 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-primary">{article.source}</p>
              <CardTitle className="text-base font-bold font-headline leading-tight">
                {article.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 text-sm">
          <p className="text-muted-foreground mb-3 leading-relaxed line-clamp-3">
            {article.description}
          </p>
          <div className="flex justify-between text-xs text-muted-foreground items-center">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(article.timestamp), { addSuffix: true })}
            </div>
            <Badge variant="outline" className="text-primary border-primary/50">
              News
            </Badge>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}


export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const [incidents, news] = await Promise.all([
          getIncidents(),
          getNewsArticles(),
        ]);
        
        const allAlerts = [...incidents, ...news];

        const sortedAlerts = allAlerts.sort((a, b) => {
          // Logic to sort active incidents to the top
          if (a.kind === 'incident' && a.status === 'active' && (b.kind !== 'incident' || b.status !== 'active')) return -1;
          if (b.kind === 'incident' && b.status === 'active' && (a.kind !== 'incident' || a.status !== 'active')) return 1;
          // Then sort by timestamp
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setAlerts(sortedAlerts);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  return (
    <PhoneLayout>
      <Header title="Nearby Alerts" />

      <main className="flex-grow pt-16 overflow-y-auto bg-muted/30">
        <div className="p-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))
          ) : (
            alerts.map((item) =>
              item.kind === 'incident' ? (
                <AlertCard key={item.id} incident={item} />
              ) : (
                <NewsCard key={item.id} article={item} />
              )
            )
          )}
        </div>
      </main>
    </PhoneLayout>
  );
}
