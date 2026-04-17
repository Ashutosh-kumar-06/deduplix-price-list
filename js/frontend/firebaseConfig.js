import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

function normalizeAuthDomain(value, fallback) {
  const raw = (value || fallback || "").trim();
  if (!raw) return "";

  // Firebase expects authDomain like "project.firebaseapp.com" (no protocol/path).
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .split("/")[0];
}

const firebaseConfig = {
  apiKey: window.__APP_CONFIG__?.FIREBASE_API_KEY || "",
  authDomain: normalizeAuthDomain(
    window.__APP_CONFIG__?.FIREBASE_AUTH_DOMAIN,
    "pllist-ff754.firebaseapp.com",
  ),
  projectId: window.__APP_CONFIG__?.FIREBASE_PROJECT_ID || "pllist-ff754",
  storageBucket:
    window.__APP_CONFIG__?.FIREBASE_STORAGE_BUCKET ||
    "pllist-ff754.firebasestorage.app",
  messagingSenderId:
    window.__APP_CONFIG__?.FIREBASE_MESSAGING_SENDER_ID || "648899449204",
  appId:
    window.__APP_CONFIG__?.FIREBASE_APP_ID ||
    "1:648899449204:web:e5b016e0dbb532b7551c21",
  measurementId:
    window.__APP_CONFIG__?.FIREBASE_MEASUREMENT_ID || "G-V2P325E9EH",
};

let firebaseApp = null;
let auth = null;
let provider = null;
let pendingGoogleLoginPromise = null;

function getFirebaseAuthContext() {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Google login is not configured. Set FIREBASE_API_KEY in .env or provide window.__APP_CONFIG__.FIREBASE_API_KEY.",
    );
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    provider = new GoogleAuthProvider();
  }

  return { auth, provider };
}

// Login Function
export const loginWithGoogle = async () => {
  if (pendingGoogleLoginPromise) {
    return pendingGoogleLoginPromise;
  }

  pendingGoogleLoginPromise = (async () => {
    try {
      const context = getFirebaseAuthContext();
      const result = await signInWithPopup(context.auth, context.provider);
      console.log("User Info:", result.user);
      return result.user;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    } finally {
      pendingGoogleLoginPromise = null;
    }
  })();

  return pendingGoogleLoginPromise;
};
