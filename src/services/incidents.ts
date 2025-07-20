import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, GeoPoint } from 'firebase/firestore';
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
        case 'pothole':
        case 'infrastructure_issue':
            return 'infrastructure';
        default:
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
