"use client";

import Image from "next/image";
import {
  Car,
  Construction,
  ShieldAlert,
  MapPin,
  Loader2,
} from "lucide-react";
import type { Incident, IncidentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";

const incidentTypeConfig: Record<
  IncidentType,
  { icon: React.ElementType; color: string; label: string }
> = {
  traffic: { icon: Car, color: "bg-destructive", label: "Traffic" },
  safety: { icon: ShieldAlert, color: "bg-accent", label: "Safety" },
  infrastructure: {
    icon: Construction,
    color: "bg-primary",
    label: "Infrastructure",
  },
};

function IncidentMarker({
  incident,
  onClick,
}: {
  incident: Incident;
  onClick: () => void;
}) {
  const config = incidentTypeConfig[incident.type];
  const Icon = config.icon || MapPin;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="absolute -translate-x-1/2 -translate-y-1/2 transform focus:outline-none"
            style={{
              top: `${incident.location.lat}%`,
              left: `${incident.location.lng}%`,
              zIndex: incident.status === "active" ? 10 : 5,
            }}
            aria-label={`View incident: ${incident.title}`}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg ring-2 ring-background transition-transform duration-300 hover:scale-110",
                config.color,
                incident.status === "resolved" && "opacity-50 grayscale"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {config.label}: {incident.title}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MapView({
  incidents,
  onMarkerClick,
}: {
  incidents: Incident[];
  onMarkerClick: (incident: Incident) => void;
}) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // This state is no longer needed to control zoom via component state.
  // const [zoom, setZoom] = useState(0.1); 

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description:
              "Please enable location services to see a map of your area. Displaying a default map.",
          });
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  }, []);

  const getMapUrl = () => {
    // Default to San Francisco if location is not available
    const lat = location?.lat ?? 37.7749;
    const lon = location?.lon ?? -122.4194;
    const zoomLevel = 13;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lon}`;
  };

  return (
    <div className="relative w-full h-full bg-gray-200 overflow-hidden">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Fetching your location...</p>
        </div>
      ) : (
        <iframe
          width="100%"
          height="100%"
          className="grayscale-[50%] opacity-80"
          src={getMapUrl()}
          style={{ border: 0 }}
          title="City map"
          data-ai-hint="city map"
        ></iframe>
      )}

      {!loading && (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {incidents.map((incident) => (
            <div key={incident.id} className="pointer-events-auto">
              <IncidentMarker
                incident={incident}
                onClick={() => onMarkerClick(incident)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
