import express from "express";
import {
  uploadPriceList,
  getPrices,
  createPrice,
  updatePrice,
  deletePrice,
  getDuplicateGroups,
  removeDuplicate,
  resolveDuplicate,
  getPriceStats,
  downloadCleaned,
} from "../controllers/priceController.js";

const router = express.Router();

// Public endpoints
router.post("/upload", uploadPriceList);
router.get("/", getPrices);
router.get("/duplicates", getDuplicateGroups);
router.get("/stats", getPriceStats);
router.get("/download-cleaned", downloadCleaned);

// CRUD endpoints
router.post("/", createPrice);
router.put("/:id", updatePrice);
router.delete("/:id", deletePrice);

// Resolution endpoints
router.post("/resolve", resolveDuplicate);
router.delete("/remove-duplicate/:id", removeDuplicate);

export default router;
