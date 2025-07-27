import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, GeoPoint, addDoc, query, orderBy, limit } from 'firebase/firestore';
import type { Incident, IncidentType } from '@/lib/types';

function mapEventTypeToIncidentType(eventType: string): IncidentType {
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

    const directMatch = (Object.keys(mapping) as Array<keyof typeof mapping>).find(key => key === lowerEventType);
    if(directMatch) {
        return mapping[directMatch];
    }

    // Fallback for snake_case and other variations
    const snakeCaseMatch = (Object.keys(mapping) as Array<keyof typeof mapping>).find(key => key === lowerEventType.replace(/_/g, ' '));
     if(snakeCaseMatch) {
        return mapping[snakeCaseMatch];
    }
    
    const validTypes: IncidentType[] = ["traffic", "safety", "infrastructure", "road_hazard", "accident", "pothole", "public_disturbance"];
    if (validTypes.includes(eventType as IncidentType)) {
        return eventType as IncidentType;
    }

    return 'infrastructure'; // Default fallback
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
        eventType: report.type // Make sure eventType is consistent
    });

    // 2. Submit to Google Cloud Run
    if (cloudRunUrl) {
        try {
            // Convert GeoPoint to a plain object for JSON serialization
            const payload = {
                description: report.description,
                location: {
                    latitude: report.location.latitude,
                    longitude: report.location.longitude,
                },
                reportedBy: 'anonymous',
                eventType: report.type
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
