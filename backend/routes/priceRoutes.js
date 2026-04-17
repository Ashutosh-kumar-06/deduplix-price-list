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
  bulkResolveRecords,
  downloadDuplicateReport,
} from "../controllers/priceController.js";

const router = express.Router();

// Public endpoints
router.post("/upload", uploadPriceList);
router.get("/", getPrices);
router.get("/duplicates", getDuplicateGroups);
router.get("/stats", getPriceStats);
router.get("/download-cleaned", downloadCleaned);
router.get("/download-duplicates", downloadDuplicateReport);

// CRUD endpoints
router.post("/", createPrice);
router.put("/:id", updatePrice);
router.delete("/:id", deletePrice);

// Resolution endpoints
router.post("/resolve", resolveDuplicate);
router.delete("/remove-duplicate/:id", removeDuplicate);
router.post("/bulk-resolve", bulkResolveRecords);

export default router;
