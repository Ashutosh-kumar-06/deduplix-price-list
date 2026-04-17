import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import priceRoutes from "./backend/routes/priceRoutes.js";
import authRoutes from "./backend/routes/authRoutes.js";
import { connectDB } from "./backend/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true });

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
  const firebaseApiKey =
    process.env.FIREBASE_API_KEY || process.env.Google_api || "";

  res.type("application/javascript").send(`
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
window.__APP_CONFIG__.FIREBASE_API_KEY = ${JSON.stringify(firebaseApiKey)};
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
