// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration from your new project
const firebaseConfig = {
  apiKey: "AIzaSyAQM4NcOrgkrERq8yORoXvvrNmkcLA_t8g",
  authDomain: "oval-bot-472512-s4.firebaseapp.com",
  projectId: "oval-bot-472512-s4",
  storageBucket: "oval-bot-472512-s4.appspot.com",
  messagingSenderId: "883976203495",
  appId: "1:883976203495:web:d1df31aeae53e4c00f8642",
  measurementId: "G-MYL5XLGRQL"
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error", error);
  // You might want to throw the error or handle it in a way
  // that your application can gracefully fail.
  // For now, we'll log it and the app will likely fail
  // when db or storage are used.
}

export { db, storage };
