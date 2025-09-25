// src/lib/firebaseService.ts

import { db, storage } from '@/lib/firebase'; // Assuming your firebase config is in this path
import { collection, getDocs, Timestamp, GeoPoint, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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

// --- UTILITY FUNCTIONS ---

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
    
    const validTypes: IncidentType[] = ["traffic", "safety", "infrastructure", "road_hazard", "accident", "pothole", "public_disturbance"];
    if (validTypes.includes(eventType as IncidentType)) {
        return eventType as IncidentType;
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
 * Uploads a single file to Firebase Storage.
 * @param file The file object to upload.
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export const uploadFile = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `reports/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};

/**
 * Submits the user report metadata to the 'UserReports' collection in Firestore.
 * @param report The report object containing metadata and media URLs.
 * @returns A promise that resolves with the success status.
 */
export async function submitUserReport(report: UserReport): Promise<{ success: boolean, error?: Error }> {
    try {
        const reportsCol = collection(db, 'UserReports');
        const timestamp = Timestamp.now();

        await addDoc(reportsCol, {
            ...report,
            timestamp: timestamp,
            eventType: report.type 
        });

        // The optional Cloud Run submission logic can remain here
        // ...

        return { success: true };
    } catch (error) {
        console.error("Error in submitUserReport:", error);
        return { success: false, error: error as Error };
    }
}


// --- NEW ORCHESTRATOR FUNCTION (CALL THIS FROM YOUR UI) ---

/**
 * Handles the full report submission process: uploads file, then submits report data.
 * @param type The type of incident reported by the user.
 * @param description The text description from the user.
 * @param location The geographic coordinates of the incident.
 * @param file The image file uploaded by the user (can be null).
 * @returns A promise that resolves with the final success status.
 */
export const handleNewReportSubmission = async (
    type: IncidentType,
    description: string,
    location: { latitude: number, longitude: number },
    file: File | null
): Promise<{ success: boolean, error?: any }> => {
    try {
        let imageUrls: string[] = [];

        // Step 1: Upload the file to Firebase Storage if it exists
        if (file) {
            console.log("Uploading file...");
            const downloadUrl = await uploadFile(file);
            imageUrls.push(downloadUrl);
            console.log("File uploaded successfully:", downloadUrl);
        }

        // Step 2: Prepare the report object for Firestore
        const newReport: UserReport = {
            type,
            description,
            location: new GeoPoint(location.latitude, location.longitude),
            mediaUrls: imageUrls, // Use the URL from the upload
        };

        // Step 3: Submit the complete report metadata to Firestore
        console.log("Submitting report to Firestore...");
        const result = await submitUserReport(newReport);

        if (result.success) {
            console.log("Report submitted successfully!");
            return { success: true };
        } else {
            // Propagate the error from the submission function
            throw result.error;
        }

    } catch (error) {
        console.error("Failed to submit new report:", error);
        return { success: false, error };
    }
};