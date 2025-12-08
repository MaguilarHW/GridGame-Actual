import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0GGjmup3q9Epp7Ln3_og53X2jEVmO_AQ",
  authDomain: "gridgame-1765217915.firebaseapp.com",
  projectId: "gridgame-1765217915",
  storageBucket: "gridgame-1765217915.firebasestorage.app",
  messagingSenderId: "464040611716",
  appId: "1:464040611716:web:418c97f3f693da174b57d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

