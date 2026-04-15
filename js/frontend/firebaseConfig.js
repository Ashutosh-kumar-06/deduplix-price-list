// Browser ke liye CDN wala rasta use karna hoga
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTT8AMDlP_q0WwWGIFNnKNJUM5PNORw7M",
  authDomain: "de-duplix-price-lsit-number.firebaseapp.com",
  projectId: "de-duplix-price-lsit-number",
  storageBucket: "de-duplix-price-lsit-number.firebasestorage.app",
  messagingSenderId: "72986338031",
  appId: "1:72986338031:web:c6d0e1df12a22c4515f11a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inko export karein taaki loginPage.js mein use ho sakein
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Login Function
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("User Info:", result.user);
    return result.user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};