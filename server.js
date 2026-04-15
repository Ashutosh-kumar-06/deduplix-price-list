import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import priceRoutes from "./backend/routes/priceRoutes.js"; // Auth hata diya kyunki ab Firebase hai
import { connectDB } from "./backend/config/db.js";

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (Frontend code)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use("/api/prices", priceRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "PL Dedup API running with Firebase Support" });
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