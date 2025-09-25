
// src/lib/firebaseService.ts

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, Timestamp, GeoPoint, addDoc, query, orderBy, limit, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  imageUrl?: string;
}

export interface UserReport {
  type: IncidentType;
  description: string;
  location: GeoPoint;
  mediaUrls: string[];
}

// --- CONFIGURATION ---

const CLOUD_SERVICE_ENDPOINT = "https://data-ingestor-883976203495.asia-south1.run.app/ingest";


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
    if (lowerEventType.includes('road_hazard') || lowerEventType.includes('pothole')) {
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
  const eventsCol = collection(db, "events");
  const eventSnapshot = await getDocs(eventsCol);

  const incidents = await Promise.all(
    eventSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

      const timestamp =
        data.firestoreCreatedAt instanceof Timestamp
          ? data.firestoreCreatedAt.toDate().toISOString()
          : new Date().toISOString();

      let location = { lat: 13.0827, lng: 80.2707 };
      if (
        data.location &&
        typeof data.location.latitude === "number" &&
        typeof data.location.longitude === "number"
      ) {
        location = {
          lat: data.location.latitude,
          lng: data.location.longitude,
        };
      }

      const eventType = data.eventType || "unknown";
      const type = mapEventTypeToIncidentType(eventType);

      const status =
        data.status?.toLowerCase() === "resolved" ? "resolved" : "active";
      const severity = (data.severity?.toLowerCase() || "medium") as
        | "low"
        | "medium"
        | "high";

      // --- handle image field ---
      let imageUrl: string | undefined = data.imageUrl;
      if (!imageUrl && data.mediaUrls?.length) {
        imageUrl = data.mediaUrls[0];
      }
      // If only a storage path is stored, resolve it
      if (imageUrl && !imageUrl.startsWith("http")) {
        try {
          imageUrl = await getDownloadURL(ref(storage, imageUrl));
        } catch (e) {
          console.warn("Failed to resolve image URL:", e);
        }
      }

      return {
        id: docSnap.id,
        type,
        status,
        severity,
        location,
        title: data.summary || "Incident Report",
        description:
          data.aiGeneratedSummary ||
          data.description ||
          "No description provided.",
        timestamp,
        imageUrl,
      } as Incident;
    })
  );

  return incidents;
}

export async function getUserReports(): Promise<Incident[]> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];

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
      status: data.status || 'active',
      severity: 'medium',
      location: location,
      title: data.type || "User Report",
      description: data.description || 'No description provided.',
      timestamp: timestamp,
    } as Incident;
  });
}


// --- MEDIA UPLOAD ---

/**
 * Uploads a media file to Firebase Storage.
 * @param file The file to upload.
 * @returns A promise that resolves with the public URL of the uploaded file.
 */
export async function uploadReportMedia(file: File): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");

    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const filePath = `user-reports/${user.uid}/${fileId}-${file.name}`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
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

        // 1. Save to Firestore first to get the document ID
        const firestoreDoc = await addDoc(collection(db, 'UserReports'), {
            ...report,
            userId: user?.uid || null,
            userEmail: user?.email || null,
            timestamp: timestamp,
            status: 'active'
        });

        // 2. Prepare data for Cloud Service, now including the Firestore Document ID
        const payload = {
            ...report,
            firestoreDocId: firestoreDoc.id, // Add the document ID here
            userId: user?.uid || null,
            userEmail: user?.email || null,
            timestamp: timestamp.toDate().toISOString(),
            location: {
                latitude: report.location.latitude,
                longitude: report.location.longitude,
            },
        };
        
        // 3. Send to Cloud Service
        const cloudServiceResponse = await fetch(CLOUD_SERVICE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!cloudServiceResponse.ok) {
            const errorText = await cloudServiceResponse.text();
            throw new Error(`Cloud Service returned an error: ${cloudServiceResponse.status} ${cloudServiceResponse.statusText} - ${errorText}`);
        }

        return { success: true };

    } catch (error) {
        console.error("Error in submitUserReport:", error);
        return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
}
