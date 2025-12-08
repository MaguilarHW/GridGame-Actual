import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let app = null;
let auth = null;
let db = null;

// Only initialize Firebase if all config values are present
if (missingConfig.length === 0) {
  try {
    app = initializeApp(firebaseConfig);

    // Validate Firebase config format
    if (!firebaseConfig.apiKey || !firebaseConfig.apiKey.startsWith("AIza")) {
      console.warn("Invalid Firebase API key format");
    } else {
      // Initialize Auth and Firestore only if config is valid
      try {
        auth = getAuth(app);
        db = getFirestore(app);
      } catch (error) {
        console.warn("Firebase services initialization error:", error);
        // Allow app to continue without Firebase
      }
    }
  } catch (error) {
    console.warn("Firebase initialization error:", error);
    // Allow app to continue without Firebase
  }
} else {
  console.warn(
    "Firebase not configured. Missing env vars:",
    missingConfig.join(", ")
  );
  console.warn(
    "App will run in offline mode. Leaderboard and multiplayer features will be disabled."
  );
}

export { auth, db };
export default app;
