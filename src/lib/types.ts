export type IncidentType = "traffic" | "safety" | "infrastructure";
export type IncidentStatus = "active" | "resolved";

export type Incident = {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: "low" | "medium" | "high";
  location: {
    lat: number;
    lng: number;
  };
  title: string;
  description: string;
  timestamp: string; // ISO 8601 string format
  imageUrl?: string;
};
