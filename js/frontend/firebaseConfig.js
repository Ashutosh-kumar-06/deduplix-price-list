import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:
    window.__APP_CONFIG__?.FIREBASE_API_KEY ||
    globalThis.process?.env?.Google_api ||
    "",
  authDomain: "de-duplix-price-lsit-number.firebaseapp.com",
  projectId: "de-duplix-price-lsit-number",
  storageBucket: "de-duplix-price-lsit-number.firebasestorage.app",
  messagingSenderId: "72986338031",
  appId: "1:72986338031:web:c6d0e1df12a22c4515f11a",
};

let firebaseApp = null;
let auth = null;
let provider = null;
let pendingGoogleLoginPromise = null;

function getFirebaseAuthContext() {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Google login is not configured. Set window.__APP_CONFIG__.FIREBASE_API_KEY.",
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
