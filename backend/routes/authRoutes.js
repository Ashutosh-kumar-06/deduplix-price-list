import express from "express";
import { register, login, profile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Existing Routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, profile);

// Google OAuth endpoints are disabled here unless passport strategy is wired.
router.get("/google", (req, res) => {
  res.status(501).json({
    error: true,
    message: "Google OAuth route is not configured on this server",
  });
});

router.get("/google/callback", (req, res) => {
  res.status(501).json({
    error: true,
    message: "Google OAuth callback is not configured on this server",
  });
});

export default router;
