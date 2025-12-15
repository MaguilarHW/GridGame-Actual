# Firebase Setup Guide

## Issues Fixed

1. ✅ **Firebase Auth Configuration Error** - App now handles missing environment variables gracefully
2. ✅ **Firestore Permission Denied** - Security rules have been deployed
3. ✅ **User Authentication** - Email/password and OAuth authentication added

## Required Setup Steps

### 1. Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/project/gridgame-1765217915/authentication)
2. Click on "Authentication" in the left sidebar
3. Click "Get Started" if you haven't enabled it yet
4. Go to the "Sign-in method" tab

#### Enable Email/Password Authentication

5. Click on "Email/Password"
6. Enable "Email/Password" (first toggle)
7. Optionally enable "Email link (passwordless sign-in)" if desired
8. Click "Save"

#### Enable OAuth Providers (Stretch Goal)

**Google Sign-In:** 9. Click on "Google" 10. Enable the toggle 11. Enter your project support email 12. Click "Save"

**Facebook Sign-In:** 13. Click on "Facebook" 14. Enable the toggle 15. You'll need to: - Go to [Facebook Developers](https://developers.facebook.com/) - Create an app - Get your App ID and App Secret - Add them to Firebase - Add your OAuth redirect URI: `https://gridgame-1765217915.firebaseapp.com/__/auth/handler` 16. Click "Save"

**Apple Sign-In:** 17. Click on "Apple" 18. Enable the toggle 19. You'll need: - An Apple Developer account - Configure OAuth in Apple Developer Console - Add your Service ID and Key ID 20. Click "Save"

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
- **userProfiles**: Only authenticated users can access, and only their own profile
  - Users can read/write/update/delete only their own profile document
  - Non-authenticated users cannot access this collection at all
- **publicContent**: Everyone can read, only authenticated users can write
  - Anyone (logged in or not) can read posts
  - Only authenticated users can create, update, or delete posts

## Troubleshooting

### If you see "auth/configuration-not-found":

- Check that all environment variables are set in `.env`
- Rebuild the app: `npm run build`
- Redeploy: `firebase deploy`

### If you see "permission-denied":

- Make sure Email/Password authentication is enabled in Firebase Console
- Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`

### OAuth providers not working:

- Make sure the provider is enabled in Firebase Console
- For Facebook: Verify your App ID and App Secret are correct
- For Apple: Ensure you've configured OAuth in Apple Developer Console
- Check that authorized domains include your domain in Firebase Console

### App runs in offline mode:

- The app will work without Firebase, but leaderboard and multiplayer features will be disabled
- Check browser console for warnings about missing Firebase configuration

## Authentication Features

The app now includes:

- ✅ Email/Password sign up and login
- ✅ Google OAuth sign-in
- ✅ Facebook (Meta) OAuth sign-in
- ✅ Apple OAuth sign-in
- ✅ Separate views for authenticated and non-authenticated users
- ✅ Logout functionality
