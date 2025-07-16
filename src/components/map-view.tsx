"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  Libraries, // Import Libraries type
} from "@react-goolge-maps/api";
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
import { useToast } from "@/hooks/use-toast";

// --- Google Maps API Key ---
// It's best practice to store this in an environment variable.
// Create a .env.local file in your project root:
// NEXT_PUBLIC_Maps_API_KEY="YOUR_Maps_API_KEY"
const Maps_API_KEY = process.env.NEXT_PUBLIC_Maps_API_KEY || "";

const libraries: Libraries = ["places"]; // You might need 'geometry' or 'drawing' later. 'places' is often useful.

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

// Removed the custom IncidentMarker component as Google Maps has its own Marker component.
// The icon customization will be done directly within the Google Maps Marker.

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
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(12); // Initial zoom level

  useEffect(() => {
    // Attempt to get user's current location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setZoom(14); // Zoom in more if we have a precise location
        },
        (err) => {
          setError(err.message);
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description:
              "Please enable location services to see a map of your area. Displaying a default location (Chennai, India).",
          });
          // Fallback to Chennai if location access is denied or not supported
          setMapCenter({ lat: 13.0827, lng: 80.2707 }); // Chennai coordinates
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description:
          "Your browser does not support geolocation. Displaying a default map (Chennai, India).",
      });
      // Fallback to Chennai if geolocation is not supported
      setMapCenter({ lat: 13.0827, lng: 80.2707 }); // Chennai coordinates
    }
  }, []);

  // Memoize the map options to prevent unnecessary re-renders
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false, // You can set this to true to remove default UI
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    }),
    []
  );

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
        <p>Error loading Google Maps: {loadError.message}</p>
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
        zoom={zoom}
        options={mapOptions}
        // You can add an onLoad callback if needed, but not strictly necessary for basic display
        // onLoad={(map) => console.log('Map loaded', map)}
      >
        {incidents.map((incident) => {
          const config = incidentTypeConfig[incident.type];
          // Create a custom SVG for the marker icon
          const markerIcon = {
            path: MapPin.toString(), // Use the SVG path from Lucide icon
            fillColor: config.color.replace('bg-', '#'), // Convert Tailwind bg-color to hex or similar
            fillOpacity: incident.status === "resolved" ? 0.3 : 1,
            strokeWeight: 0,
            scale: 1.2, // Adjust size
            anchor: new google.maps.Point(12, 24), // Center the icon
            // For custom icons, you might use:
            // url: '/path/to/your/custom-marker.png',
            // scaledSize: new google.maps.Size(32, 32),
          };

          return (
              <Marker
              key={incident.id}
              position={{ lat: incident.location.lat, lng: incident.location.lng }}
              onClick={() => onMarkerClick(incident)}
              title={incident.title}
              icon={markerIcon}
            >
              {/* You can add an InfoWindow here if you want it to open on click */}
              {/* <InfoWindow onCloseClick={() => setSelectedIncident(null)}>
                <div>
                  <h3>{incident.title}</h3>
                  <p>{incident.description}</p>
                </div>
              </InfoWindow> */}
            </Marker>
          )
        })}
      </GoogleMap>
    </div>
  );
}
