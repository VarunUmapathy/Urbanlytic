export type IncidentType = "traffic" | "safety" | "infrastructure" | "road_hazard" | "accident" | "pothole" | "public_disturbance";
export type IncidentStatus = "active" | "resolved" | "discarded";

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
  reason?: string;
  kind: 'incident';
};

export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  timestamp: string; // ISO 8601 string format
  kind: 'news';
};

export type AlertItem = Incident | NewsArticle;
