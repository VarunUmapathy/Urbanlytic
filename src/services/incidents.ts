import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import type { Incident } from '@/lib/types';

export async function getIncidents(): Promise<Incident[]> {
  const incidentsCol = collection(db, 'incidents');
  const incidentSnapshot = await getDocs(incidentsCol);
  const incidents = incidentSnapshot.docs.map(doc => {
    const data = doc.data();
    // Firestore Timestamps need to be converted to serializable format (ISO string)
    const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString();
    
    return {
      id: doc.id,
      ...data,
      timestamp,
    } as Incident;
  });
  return incidents;
}
