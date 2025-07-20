import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import type { Incident, IncidentType } from '@/lib/types';

function parseLocation(locationStr: string): { lat: number; lng: number } {
  try {
    const parts = locationStr.replace('° N', '').replace('° E', '').split(', ');
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  } catch (e) {
    console.error('Error parsing location string:', locationStr, e);
  }
  // Return a default location if parsing fails
  return { lat: 13.0827, lng: 80.2707 };
}

function mapEventTypeToIncidentType(eventType: string): IncidentType {
    switch (eventType.toLowerCase()) {
        case 'road_hazard':
        case 'pothole':
            return 'infrastructure';
        case 'traffic_jam':
        case 'accident':
            return 'traffic';
        case 'suspicious_activity':
        case 'public_disturbance':
            return 'safety';
        default:
            return 'infrastructure';
    }
}


export async function getIncidents(): Promise<Incident[]> {
  const eventsCol = collection(db, 'events');
  const eventSnapshot = await getDocs(eventsCol);
  const incidents = eventSnapshot.docs.map(doc => {
    const data = doc.data();
    
    // Firestore Timestamps need to be converted to serializable format (ISO string)
    const timestamp = data.firestoreCreatedAt instanceof Timestamp 
      ? data.firestoreCreatedAt.toDate().toISOString() 
      : new Date().toISOString();
    
    const location = typeof data.location === 'string' 
      ? parseLocation(data.location)
      // Fallback for GeoPoint or other formats if needed in the future
      : (data.location && data.location.latitude && data.location.longitude 
          ? { lat: data.location.latitude, lng: data.location.longitude }
          : { lat: 13.0827, lng: 80.2707 });

    const eventType = data.eventType || 'unknown';
    const type = mapEventTypeToIncidentType(eventType);
    
    const title = eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
      id: doc.id,
      type: type,
      status: data.status || 'active',
      severity: data.severity || 'medium',
      location: location,
      title: data.title || title,
      description: data.description || 'No description provided.',
      timestamp: timestamp,
      imageUrl: data.imageUrl,
    } as Incident;
  });
  return incidents;
}
