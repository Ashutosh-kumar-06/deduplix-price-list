import express from "express";
import passport from "passport"; // Isse pehle install karna hoga: npm install passport
import { register, login, profile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Existing Routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, profile);

// --- Google Auth Routes ---

// 1. Jab user button click karega
router.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"] 
}));

// 2. Google jab wapas aapke server par data bhejega
router.get("/google/callback", 
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    // Login success! Yahan hum frontend par user aur token bhejenge
    // Maan lijiye aapka frontend localhost:3000 par hai
    const token = req.user.token; 
    const userData = JSON.stringify(req.user.user);
    
    // Frontend par redirect karein aur URL mein data bhej dein
    res.redirect(`/index.html?token=${token}&user=${encodeURIComponent(userData)}`);
  }
);

export default router;