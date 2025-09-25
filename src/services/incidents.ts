// src/lib/firebaseService.ts

import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, GeoPoint, addDoc, query, orderBy, limit } from 'firebase/firestore';

// --- TYPE DEFINITIONS ---

export type IncidentType = "traffic" | "safety" | "infrastructure" | "road_hazard" | "accident" | "pothole" | "public_disturbance";

export interface Incident {
  id: string;
  type: IncidentType;
  status: 'active' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  location: { lat: number; lng: number };
  title: string;
  description: string;
  timestamp: string; // ISO string format
  imageUrl?: string;
}

export interface UserReport {
  type: IncidentType;
  description: string;
  location: GeoPoint;
  mediaUrls?: string[];
}

// --- UTILITY FUNCTIONS ---

function mapEventTypeToIncidentType(eventType: string): IncidentType {
    if (!eventType) {
        return 'infrastructure';
    }
    
    const lowerEventType = eventType.toLowerCase().replace(/_/g, ' ');

    const mapping: Record<string, IncidentType> = {
        'traffic jam': 'traffic',
        'accident': 'accident',
        'suspicious activity': 'safety',
        'public disturbance': 'public_disturbance',
        'road hazard': 'road_hazard',
        'pothole': 'pothole',
        'infrastructure issue': 'infrastructure',
        'traffic': 'traffic',
        'safety': 'safety',
        'infrastructure': 'infrastructure'
    };
    
    // Check for a direct match in the mapping
    if (mapping[lowerEventType]) {
        return mapping[lowerEventType];
    }
    
    // Check if the lowercase type is a valid incident type itself
    const validTypes: IncidentType[] = ["traffic", "safety", "infrastructure", "road_hazard", "accident", "pothole", "public_disturbance"];
    if (validTypes.includes(lowerEventType as IncidentType)) {
        return lowerEventType as IncidentType;
    }

    return 'infrastructure'; // Default fallback
}


// --- DATA FETCHING FUNCTIONS ---

export async function getIncidents(): Promise<Incident[]> {
  const eventsCol = collection(db, 'events');
  const eventSnapshot = await getDocs(eventsCol);
  const incidents = eventSnapshot.docs.map(doc => {
    const data = doc.data();
    
    const timestamp = data.firestoreCreatedAt instanceof Timestamp 
      ? data.firestoreCreatedAt.toDate().toISOString() 
      : new Date().toISOString();
    
    let location = { lat: 13.0827, lng: 80.2707 }; // Default location
    if (data.location instanceof GeoPoint) {
      location = { lat: data.location.latitude, lng: data.location.longitude };
    }

    const eventType = data.eventType || 'unknown';
    const type = mapEventTypeToIncidentType(eventType);
    
    const status = (data.status?.toLowerCase() === 'resolved') ? 'resolved' : 'active';
    const severity = (data.severity?.toLowerCase() || 'medium') as "low" | "medium" | "high";

    return {
      id: doc.id,
      type: type,
      status: status,
      severity: severity,
      location: location,
      title: data.summary || "Incident Report",
      description: data.aiGeneratedSummary || data.description || 'No description provided.',
      timestamp: timestamp,
      imageUrl: data.imageUrl,
    } as Incident;
  });
  return incidents;
}

export async function getUserReports(): Promise<Incident[]> {
  const reportsCol = collection(db, 'UserReports');
  const q = query(reportsCol, orderBy('timestamp', 'desc'), limit(10));
  const reportSnapshot = await getDocs(q);

  return reportSnapshot.docs.map(doc => {
    const data = doc.data();
    
    const timestamp = data.timestamp instanceof Timestamp 
      ? data.timestamp.toDate().toISOString() 
      : new Date().toISOString();
    
    let location = { lat: 13.0827, lng: 80.2707 }; // Default location
    if (data.location instanceof GeoPoint) {
      location = { lat: data.location.latitude, lng: data.location.longitude };
    }
    
    const type = mapEventTypeToIncidentType(data.type || 'unknown');

    return {
      id: doc.id,
      type: type,
      status: 'active',
      severity: 'medium',
      location: location,
      title: data.type || "User Report",
      description: data.description || 'No description provided.',
      timestamp: timestamp,
      imageUrl: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls[0] : undefined,
    } as Incident;
  });
}


// --- CORE SUBMISSION LOGIC ---

/**
 * Submits the user report metadata to the 'UserReports' collection in Firestore.
 * @param report The report object containing metadata.
 * @returns A promise that resolves with the success status.
 */
export async function submitUserReport(report: UserReport): Promise<{ success: boolean, error?: Error }> {
    try {
        const reportsCol = collection(db, 'UserReports');
        const timestamp = Timestamp.now();

        await addDoc(reportsCol, {
            ...report,
            mediaUrls: [], // Always submit with an empty array
            timestamp: timestamp,
            eventType: report.type 
        });

        return { success: true };
    } catch (error) {
        console.error("Error in submitUserReport:", error);
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
