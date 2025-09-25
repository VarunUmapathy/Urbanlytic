// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

console.log("Firebase connected successfully! Project ID:", firebaseConfig.projectId);


export { db, storage };
