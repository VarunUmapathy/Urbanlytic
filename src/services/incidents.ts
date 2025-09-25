

// src/lib/firebaseService.ts

import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, GeoPoint, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
}

export interface UserReport {
  type: IncidentType;
  description: string;
  location: GeoPoint;
  mediaUrls: string[];
}

// --- CONFIGURATION ---

// TODO: Replace with the correct full endpoint URL, including the path (e.g., /submit).
const CLOUD_SERVICE_ENDPOINT = "https://data-ingestor-883976203495.asia-south1.run.app/submit";


// --- UTILITY FUNCTIONS ---

function mapEventTypeToIncidentType(eventType: string): IncidentType {
    if (!eventType) {
        return 'infrastructure';
    }
    
    const lowerEventType = eventType.toLowerCase();

    if (lowerEventType.includes('traffic') || lowerEventType.includes('accident')) {
        return 'traffic';
    }
    if (lowerEventType.includes('safety') || lowerEventType.includes('public_disturbance')) {
        return 'safety';
    }
    if (lowerEventType.includes('pothole') || lowerEventType.includes('road_hazard')) {
        return 'road_hazard';
    }
    
    const mapping: Record<string, IncidentType> = {
        'traffic': 'traffic',
        'accident': 'accident',
        'safety': 'safety',
        'public_disturbance': 'public_disturbance',
        'road_hazard': 'road_hazard',
        'pothole': 'pothole',
        'infrastructure': 'infrastructure'
    };
    
    if (mapping[lowerEventType]) {
        return mapping[lowerEventType];
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
    } as Incident;
  });
}


// --- CORE SUBMISSION LOGIC ---

/**
 * Submits the user report to Firestore and an external cloud service.
 * @param report The report object containing metadata.
 * @returns A promise that resolves with the success status.
 */
export async function submitUserReport(report: UserReport): Promise<{ success: boolean, error?: Error }> {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        const timestamp = Timestamp.now();

        // 1. Prepare data for Firestore
        const firestorePromise = addDoc(collection(db, 'UserReports'), {
            ...report,
            userId: user?.uid || null,
            userEmail: user?.email || null,
            timestamp: timestamp,
            eventType: report.type 
        });

        // 2. Prepare data for Cloud Service
        const payload = {
            ...report,
            userId: user?.uid || null,
            userEmail: user?.email || null,
            timestamp: timestamp.toDate().toISOString(),
            location: {
                latitude: report.location.latitude,
                longitude: report.location.longitude,
            },
        };
        
        // --- This part is commented out to prevent 404 errors. ---
        // --- Uncomment it after you confirm the correct CLOUD_SERVICE_ENDPOINT path. ---
        /*
        const cloudServicePromise = fetch(CLOUD_SERVICE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).then(response => {
            if (!response.ok) {
                throw new Error(`Cloud Service returned an error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        });
        */

        // Execute only the Firestore submission for now
        await firestorePromise;
        
        // When ready, use Promise.all to ensure both succeed
        // await Promise.all([firestorePromise, cloudServicePromise]);

        return { success: true };

    } catch (error) {
        console.error("Error in submitUserReport:", error);
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
