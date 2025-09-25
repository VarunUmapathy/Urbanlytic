
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { PhoneLayout } from "@/components/phone-layout";
import { UrbanPulseLogo } from "@/components/icons";
import { MapView } from "@/components/map-view";
import { getIncidents } from "@/services/incidents";
import type { Incident } from "@/lib/types";
import { IncidentSheet } from "@/components/incident-sheet";
import { FilterPopover, type Filters } from "@/components/filter-popover";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReportIncidentDialog } from "@/components/report-incident-dialog";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    type: [],
    status: [],
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchIncidents() {
      if (user) {
        try {
          const fetchedIncidents = await getIncidents();
          setIncidents(fetchedIncidents);
          setFilteredIncidents(fetchedIncidents);
        } catch (error) {
          console.error("Failed to fetch incidents:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchIncidents();
  }, [user]);

  useEffect(() => {
    let newFilteredIncidents = [...incidents];

    if (filters.type.length > 0) {
      newFilteredIncidents = newFilteredIncidents.filter((incident) =>
        filters.type.includes(incident.type)
      );
    }
    if (filters.status.length > 0) {
      newFilteredIncidents = newFilteredIncidents.filter((incident) =>
        filters.status.includes(incident.status)
      );
    }

    setFilteredIncidents(newFilteredIncidents);
  }, [filters, incidents]);

  const handleMarkerClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedIncident(null);
    }
  };
  
  const handleFilterChange = (
    category: keyof Filters,
    value: string,
    checked: boolean
  ) => {
    setFilters((prev) => {
      const newValues = checked
        ? [...prev[category], value]
        : prev[category].filter((v) => v !== value);
      return { ...prev, [category]: newValues as any };
    });
  };

  const handleFilterReset = () => {
    setFilters({ type: [], status: [] });
  };
  
  if (loading || !user) {
    return (
       <PhoneLayout showBottomNav={false}>
         <div className="flex flex-col items-center justify-center h-full">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
           <p className="text-muted-foreground mt-4">Loading...</p>
         </div>
       </PhoneLayout>
    );
  }

  return (
    <PhoneLayout>
      <div className="absolute top-0 left-0 right-0 z-10 p-4 h-16 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UrbanPulseLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold font-headline text-foreground">
              Urbanlytic
            </h1>
          </div>
          <FilterPopover
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />
        </div>
      </div>
      
      {isLoading ? (
         <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
           <Loader2 className="w-8 h-8 animate-spin" />
           <p>Loading map...</p>
         </div>
      ) : (
        <MapView incidents={filteredIncidents} onMarkerClick={handleMarkerClick} />
      )}
      
      <IncidentSheet
        incident={selectedIncident}
        open={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
      
      <ReportIncidentDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
      />

      <Button
        className="absolute bottom-[calc(4rem+1rem)] right-4 z-10 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setIsReportDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Report Incident</span>
      </Button>
    </PhoneLayout>
  );
}
