"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  useLoadScript,
  Libraries,
  Marker,
} from "@react-google-maps/api";
import {
  Car,
  Construction,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import type { Incident, IncidentType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const Maps_API_KEY = process.env.NEXT_PUBLIC_Maps_API_KEY || "";

const libraries: Libraries = ["places", "marker"];

const incidentTypeConfig: Record<
  IncidentType,
  { icon: React.ElementType; color: string; label: string }
> = {
  traffic: { icon: Car, color: "#ef4444", label: "Traffic" }, // destructive
  safety: { icon: ShieldAlert, color: "#f59e0b", label: "Safety" }, // accent (approximated)
  infrastructure: {
    icon: Construction,
    color: "#3b82f6", // primary
    label: "Infrastructure",
  },
};

const createMarkerIcon = (color: string, status: 'active' | 'resolved') => {
  return {
    path: 'M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0',
    fillColor: color,
    fillOpacity: status === 'resolved' ? 0.6 : 1.0,
    strokeColor: 'white',
    strokeWeight: 2,
    scale: 1.2,
  };
};

export function MapView({
  incidents,
  onMarkerClick,
}: {
  incidents: Incident[];
  onMarkerClick: (incident: Incident) => void;
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: Maps_API_KEY,
    libraries,
  });

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description:
              "Could not access your location. Displaying a default location.",
          });
          setMapCenter({ lat: 13.0827, lng: 80.2707 }); // Fallback to Chennai
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description:
          "Your browser does not support geolocation. Displaying a default location.",
      });
      setMapCenter({ lat: 13.0827, lng: 80.2707 }); // Fallback to Chennai
    }
  }, [toast]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      mapId: "URBANLYTIC_MAP_ID",
    }),
    []
  );

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
        <p>Error loading Google Maps.</p>
        <p>Please check your API key and network connection.</p>
      </div>
    );
  }

  if (!isLoaded || !mapCenter) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={12}
        options={mapOptions}
      >
        {incidents.map((incident) => {
          const config = incidentTypeConfig[incident.type];
          return (
             <Marker
                key={incident.id}
                position={incident.location}
                title={incident.title}
                onClick={() => onMarkerClick(incident)}
                icon={createMarkerIcon(config.color, incident.status)}
              />
          );
        })}
      </GoogleMap>
    </div>
  );
}
