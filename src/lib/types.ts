export type IncidentType = "traffic" | "safety" | "infrastructure" | "road_hazard" | "accident" | "pothole" | "public_disturbance";
export type IncidentStatus = "active" | "resolved";

export type Incident = {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: "low" | "medium" | "high";
  location: {
    lat: number;
    lng: aumber;
  };
  title: string;
  description: string;
  timestamp: string; // ISO 8601 string format
  imageUrl?: string;
};
