"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

import { getIncidents } from "@/services/incidents";
import type { Incident } from "@/lib/types";
import { MapView } from "@/components/map-view";
import { IncidentSheet } from "@/components/incident-sheet";
import { ReportIncidentDialog } from "@/components/report-incident-dialog";
import { FilterPopover, type Filters } from "@/components/filter-popover";
import { PhoneLayout } from "@/components/phone-layout";
import { UrbanPulseLogo } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ type: [], status: [] });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const fetchedIncidents = await getIncidents();
        setIncidents(fetchedIncidents);
      } catch (error) {
        console.error("Failed to fetch incidents:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchIncidents();
  }, []);

  const handleFilterChange = useCallback(
    (category: keyof Filters, value: string, checked: boolean) => {
      setFilters((prev) => {
        const currentValues = prev[category];
        const newValues = checked
          ? [...currentValues, value]
          : currentValues.filter((v) => v !== value);
        return { ...prev, [category]: newValues as any };
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({ type: [], status: [] });
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const searchMatch =
        searchQuery === "" ||
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchQuery.toLowerCase());

      const typeMatch =
        filters.type.length === 0 || filters.type.includes(incident.type);

      const statusMatch =
        filters.status.length === 0 ||
        filters.status.includes(incident.status);

      return searchMatch && typeMatch && statusMatch;
    });
  }, [searchQuery, filters, incidents]);

  const handleMarkerClick = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  return (
    <PhoneLayout>
        <header className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-background/90 via-background/70 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UrbanPulseLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold font-headline text-foreground">
                Urbanlytic
              </h1>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search incidents..."
              className="pl-10 h-11 shadow-sm bg-background/80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <FilterPopover
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
            />
          </div>
        </header>

        <main className="flex-grow pt-40 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <MapView
              incidents={filteredIncidents}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </main>

        <Button
          size="lg"
          className="absolute bottom-20 right-4 rounded-full h-14 w-14 shadow-lg z-20"
          onClick={() => setReportDialogOpen(true)}
          aria-label="Report new incident"
        >
          <Plus className="h-7 w-7" />
        </Button>

        <IncidentSheet
          incident={selectedIncident}
          open={!!selectedIncident}
          onOpenChange={(open) => !open && setSelectedIncident(null)}
        />
        
        <ReportIncidentDialog
          open={isReportDialogOpen}
          onOpenChange={setReportDialogOpen}
        />
    </PhoneLayout>
  );
}
