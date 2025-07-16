"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

import { mockIncidents } from "@/lib/mock-data";
import type { Incident } from "@/lib/types";
import { BottomNav } from "@/components/bottom-nav";
import { MapView } from "@/components/map-view";
import { IncidentSheet } from "@/components/incident-sheet";
import { ReportIncidentDialog } from "@/components/report-incident-dialog";
import { FilterPopover, type Filters } from "@/components/filter-popover";
import { UrbanPulseLogo } from "@/components/icons";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ type: [], status: [] });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);

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
    return mockIncidents.filter((incident) => {
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
  }, [searchQuery, filters]);

  const handleMarkerClick = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  return (
    <div className="bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-[420px] h-[850px] bg-background rounded-[40px] shadow-2xl border-8 border-neutral-900 overflow-hidden relative flex flex-col">
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
          <MapView
            incidents={filteredIncidents}
            onMarkerClick={handleMarkerClick}
          />
        </main>

        <Button
          size="lg"
          className="absolute bottom-20 right-4 rounded-full h-14 w-14 shadow-lg z-20"
          onClick={() => setReportDialogOpen(true)}
          aria-label="Report new incident"
        >
          <Plus className="h-7 w-7" />
        </Button>

        <BottomNav />

        <IncidentSheet
          incident={selectedIncident}
          open={!!selectedIncident}
          onOpenChange={(open) => !open && setSelectedIncident(null)}
        />
        <ReportIncidentDialog
          open={isReportDialogOpen}
          onOpenChange={setReportDialogOpen}
        />
      </div>
    </div>
  );
}
