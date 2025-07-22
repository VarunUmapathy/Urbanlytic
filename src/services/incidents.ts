import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, GeoPoint, addDoc, query, orderBy, limit } from 'firebase/firestore';
import type { Incident, IncidentType } from '@/lib/types';

function mapEventTypeToIncidentType(eventType: string): IncidentType {
    const lowerEventType = eventType.toLowerCase();
    switch (lowerEventType) {
        case 'traffic_jam':
        case 'accident':
            return 'traffic';
        case 'suspicious_activity':
        case 'public_disturbance':
            return 'safety';
        case 'road_hazard':
            return 'road_hazard';
        case 'pothole':
            return 'pothole';
        case 'infrastructure_issue':
            return 'infrastructure';
        default:
            // Attempt to match to an existing IncidentType, otherwise default
            const validTypes: IncidentType[] = ["traffic", "safety", "infrastructure", "road_hazard", "accident", "pothole", "public_disturbance"];
            if (validTypes.includes(lowerEventType as IncidentType)) {
                return lowerEventType as IncidentType;
            }
            return 'infrastructure';
    }
}

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
      description: data.description || 'No description provided.',
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
      status: 'active', // User reports are initially active
      severity: 'medium', // Default severity
      location: location,
      title: data.type || "User Report",
      description: data.description || 'No description provided.',
      timestamp: timestamp,
      imageUrl: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls[0] : undefined,
    } as Incident;
  });
}


export type UserReport = {
    type: IncidentType;
    description: string;
    location: GeoPoint;
    mediaUrls: string[];
};

export async function submitUserReport(report: UserReport) {
    const reportsCol = collection(db, 'UserReports');
    const cloudRunUrl = process.env.NEXT_PUBLIC_CLOUD_RUN_URL;
    const timestamp = Timestamp.now();

    // 1. Submit to Firestore
    await addDoc(reportsCol, {
        ...report,
        timestamp: timestamp,
    });

    // 2. Submit to Google Cloud Run
    if (cloudRunUrl) {
        try {
            // Convert GeoPoint to a plain object for JSON serialization
            const payload = {
                ...report,
                location: {
                    latitude: report.location.latitude,
                    longitude: report.location.longitude,
                },
                timestamp: timestamp.toDate().toISOString(),
            };

            const response = await fetch(cloudRunUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Cloud Run service responded with status ${response.status}: ${errorText}`);
            }

            console.log('Successfully sent report to Cloud Run service.');
        } catch (error) {
            console.error('Failed to send report to Cloud Run service:', error);
            // We can decide if we want to re-throw the error or just log it.
            // For now, we'll just log it so the user doesn't see a failure
            // if Firestore succeeded.
        }
    }
}
