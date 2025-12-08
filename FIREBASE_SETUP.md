# Firebase Setup Guide

## Issues Fixed

1. ✅ **Firebase Auth Configuration Error** - App now handles missing environment variables gracefully
2. ✅ **Firestore Permission Denied** - Security rules have been deployed

## Required Setup Steps

### 1. Enable Anonymous Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/project/gridgame-1765217915/authentication)
2. Click on "Authentication" in the left sidebar
3. Click "Get Started" if you haven't enabled it yet
4. Go to the "Sign-in method" tab
5. Enable "Anonymous" authentication
6. Click "Save"

### 2. Verify Environment Variables

Make sure your `.env` file contains all required variables:

```
VITE_FIREBASE_API_KEY=AIzaSyA0GGjmup3q9Epp7Ln3_og53X2jEVmO_AQ
VITE_FIREBASE_AUTH_DOMAIN=gridgame-1765217915.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gridgame-1765217915
VITE_FIREBASE_STORAGE_BUCKET=gridgame-1765217915.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=464040611716
VITE_FIREBASE_APP_ID=1:464040611716:web:418c97f3f693da174b57d1
```

### 3. Rebuild After Environment Changes

If you update `.env`, rebuild the app:

```bash
npm run build
firebase deploy
```

## Firestore Security Rules

The following rules have been deployed:

- **Leaderboard**: Anyone can read, authenticated users can create
- **Games**: Anyone can read, authenticated users can create/update

## Troubleshooting

### If you see "auth/configuration-not-found":
- Check that all environment variables are set in `.env`
- Rebuild the app: `npm run build`
- Redeploy: `firebase deploy`

### If you see "permission-denied":
- Make sure Anonymous Authentication is enabled in Firebase Console
- Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`

### App runs in offline mode:
- The app will work without Firebase, but leaderboard and multiplayer features will be disabled
- Check browser console for warnings about missing Firebase configuration

