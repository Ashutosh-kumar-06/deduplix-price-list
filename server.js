import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import priceRoutes from "./backend/routes/priceRoutes.js";
import authRoutes from "./backend/routes/authRoutes.js";
import { connectDB } from "./backend/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeAuthDomain(value, fallback) {
  const raw = (value || fallback || "").trim();
  if (!raw) return "";

  // Firebase expects authDomain like "project.firebaseapp.com" (no protocol/path).
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .split("/")[0];
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (Frontend code)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/prices", priceRoutes);

// Runtime frontend config (safe public values only)
app.get("/app-config.js", (req, res) => {
  const authDomain = normalizeAuthDomain(
    process.env.FIREBASE_AUTH_DOMAIN,
    "pllist-ff754.firebaseapp.com",
  );

  const firebaseConfig = {
    apiKey:
      process.env.FIREBASE_API_KEY ||
      process.env.Google_api_key ||
      process.env.Google_api ||
      "",
    authDomain,
    projectId: process.env.FIREBASE_PROJECT_ID || "pllist-ff754",
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || "pllist-ff754.firebasestorage.app",
    messagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID || "648899449204",
    appId:
      process.env.FIREBASE_APP_ID ||
      "1:648899449204:web:e5b016e0dbb532b7551c21",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-V2P325E9EH",
  };

  res.type("application/javascript").send(`
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
window.__APP_CONFIG__.FIREBASE_API_KEY = ${JSON.stringify(firebaseConfig.apiKey)};
window.__APP_CONFIG__.FIREBASE_AUTH_DOMAIN = ${JSON.stringify(firebaseConfig.authDomain)};
window.__APP_CONFIG__.FIREBASE_PROJECT_ID = ${JSON.stringify(firebaseConfig.projectId)};
window.__APP_CONFIG__.FIREBASE_STORAGE_BUCKET = ${JSON.stringify(firebaseConfig.storageBucket)};
window.__APP_CONFIG__.FIREBASE_MESSAGING_SENDER_ID = ${JSON.stringify(firebaseConfig.messagingSenderId)};
window.__APP_CONFIG__.FIREBASE_APP_ID = ${JSON.stringify(firebaseConfig.appId)};
window.__APP_CONFIG__.FIREBASE_MEASUREMENT_ID = ${JSON.stringify(firebaseConfig.measurementId)};
`);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "PL Dedup API running with Firebase Support",
  });
});

// Serve index.html for all unmatched routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: true,
    message: err.message || "Internal server error",
  });
});

// Start server
const dbReady = connectDB();

async function startServer() {
  try {
    await dbReady;
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════╗
║  PL DEDUP API Server (Firebase Mode) ║
║  http://localhost:${PORT}             ║
╚══════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;
