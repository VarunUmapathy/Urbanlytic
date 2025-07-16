"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { IncidentStatus, IncidentType } from "@/lib/types";

export type Filters = {
  type: IncidentType[];
  status: IncidentStatus[];
};

export function FilterPopover({
  filters,
  onFilterChange,
  onReset,
}: {
  filters: Filters;
  onFilterChange: (
    category: keyof Filters,
    value: string,
    checked: boolean
  ) => void;
  onReset: () => void;
}) {
  const incidentTypes: { id: IncidentType; label: string }[] = [
    { id: "traffic", label: "Traffic" },
    { id: "safety", label: "Safety" },
    { id: "infrastructure", label: "Infrastructure" },
  ];

  const incidentStatuses: { id: IncidentStatus; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "resolved", label: "Resolved" },
  ];

  const activeFilterCount = filters.type.length + filters.status.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative bg-background/80">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium leading-none">Filters</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onReset}
            disabled={activeFilterCount === 0}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Reset filters</span>
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Incident Type</Label>
            <div className="mt-2 space-y-2">
              {incidentTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={filters.type.includes(type.id)}
                    onCheckedChange={(checked) =>
                      onFilterChange("type", type.id, !!checked)
                    }
                  />
                  <Label htmlFor={`type-${type.id}`} className="font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold">Status</Label>
            <div className="mt-2 space-y-2">
              {incidentStatuses.map((status) => (
                <div key={status.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.id}`}
                    checked={filters.status.includes(status.id)}
                    onCheckedChange={(checked) =>
                      onFilterChange("status", status.id, !!checked)
                    }
                  />
                  <Label htmlFor={`status-${status.id}`} className="font-normal cursor-pointer">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
