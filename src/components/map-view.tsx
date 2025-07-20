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
  CircleAlert,
} from "lucide-react";
import type { Incident, IncidentType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const Maps_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY || "";

const libraries: Libraries = ["places", "marker"];

// SVG paths for Lucide icons. We'll use these for the map markers.
const iconPaths = {
  car: "M14 16.5c.8-.8.8-2 0-2.8l-1.8-1.8c-.8-.8-2-.8-2.8 0L8 13.5c-.6.6-.6 1.5 0 2.1l1.8 1.8c.8.8 2.1.8 2.9 0L14 16.5zM12 12l-2-2M10 14l-2-2",
  construction: "M14 12a2 2 0 1 0-4 0v2h4v-2zM6 16a2 2 0 1 0-4 0v2h4v-2zM20 16a2 2 0 1 0-4 0v2h4v-2zM10 4a2 2 0 1 0-4 0v2h4V4zM18 4a2 2 0 1 0-4 0v2h4V4zM6 8h4M14 8h4M10 12h4M6 12v-2M14 12v-2M10 16v-2M18 16v-2M10 8V6M18 8V6",
  shieldAlert: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4m0 4h.01",
  circleAlert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01",
};

const incidentTypeConfig: Record<
  IncidentType,
  { iconPath: string; color: string; label: string }
> = {
  traffic: { iconPath: iconPaths.car, color: "#ef4444", label: "Traffic" },
  safety: { iconPath: iconPaths.shieldAlert, color: "#f99800", label: "Safety" },
  infrastructure: {
    iconPath: iconPaths.construction,
    color: "#3b82f6",
    label: "Infrastructure",
  },
  road_hazard: { iconPath: iconPaths.circleAlert, color: "#ef4444", label: "Road Hazard" },
  accident: { iconPath: iconPaths.car, color: "#ef4444", label: "Accident" },
  pothole: { iconPath: iconPaths.circleAlert, color: "#ef4444", label: "Pothole" },
  public_disturbance: { iconPath: iconPaths.shieldAlert, color: "#f99800", label: "Public Disturbance" },
};

const createMarkerIcon = (config: { iconPath: string; color: string }, status: 'active' | 'resolved') => {
  return {
    path: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`,
    fillColor: config.color,
    fillOpacity: status === 'resolved' ? 0.6 : 1.0,
    strokeColor: "#ffffff",
    strokeWeight: 1.5,
    scale: 1.5,
    anchor: new google.maps.Point(12, 24),
    labelOrigin: new google.maps.Point(12, 10),
  };
};

const createMarkerLabel = (path: string, status: 'active' | 'resolved') => ({
  text: path,
  fontFamily: "Material Icons",
  color: status === 'resolved' ? "#eeeeee" : "#ffffff",
  fontSize: "14px",
});


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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  if (!isLoaded || !mapCenter || !isClient) {
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
          if (!config) return null;

          const markerIcon = {
            path: config.iconPath,
            fillColor: "white",
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 0.8,
            anchor: new google.maps.Point(12, 12),
          };

          return (
             <Marker
                key={incident.id}
                position={incident.location}
                title={incident.title}
                onClick={() => onMarkerClick(incident)}
                icon={{
                  path: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z`,
                  fillColor: config.color,
                  fillOpacity: incident.status === 'resolved' ? 0.7 : 1.0,
                  strokeColor: "white",
                  strokeWeight: 1,
                  scale: 1.8,
                  anchor: new google.maps.Point(12, 24),
                  labelOrigin: new google.maps.Point(12, 10),
                }}
                label={{
                  text: "\ue87c", // Material Icons 'place' icon, a generic placeholder for the pin shape
                  fontFamily: "Material Icons",
                  color: config.color,
                  fontSize: "1px", // Hide the text, we only want the shape
                }}
             >
                <Marker
                  key={`${incident.id}-icon`}
                  position={incident.location}
                  title={incident.title}
                  clickable={false}
                  icon={markerIcon}
                  zIndex={google.maps.Marker.MAX_ZINDEX + 1}
                />
             </Marker>
          );
        })}
      </GoogleMap>
    </div>
  );
}
