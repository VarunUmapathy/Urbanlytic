"use client";

import Image from "next/image";
import { Car, Construction, ShieldAlert, MapPin } from "lucide-react";
import type { Incident, IncidentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  return (
    <div className="relative w-full h-full bg-gray-200 overflow-hidden">
      <Image
        src="https://placehold.co/800x1200.png"
        alt="City map"
        fill
        className="object-cover opacity-70"
        data-ai-hint="city map"
        priority
      />
      <div className="w-full h-full">
        {incidents.map((incident) => (
          <IncidentMarker
            key={incident.id}
            incident={incident}
            onClick={() => onMarkerClick(incident)}
          />
        ))}
      </div>
    </div>
  );
}
