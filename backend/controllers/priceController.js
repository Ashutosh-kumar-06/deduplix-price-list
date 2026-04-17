import PriceList from "../models/PriceList.js";
import ResolutionHistory from "../models/ResolutionHistory.js";
import { parseCSV, toCSV } from "../utils/csvParser.js";
import {
  findScoredDuplicateGroups,
  normalizePLNumber,
} from "../utils/duplicateChecker.js";

function normalizeFieldKey(key = "") {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getFirstValue(record, normalizedKeys) {
  const wanted = new Set(normalizedKeys);

  for (const [rawKey, rawValue] of Object.entries(record || {})) {
    if (!wanted.has(normalizeFieldKey(rawKey))) {
      continue;
    }

    const value =
      rawValue === undefined || rawValue === null
        ? ""
        : String(rawValue).trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function extractPLNumber(record) {
  return getFirstValue(record, ["plnumber", "plno", "pl", "pricelistnumber"]);
}

function extractDescription(record) {
  return getFirstValue(record, [
    "description",
    "desc",
    "productname",
    "product",
    "itemname",
    "name",
    "title",
    "itemdescription",
    "productdescription",
  ]);
}

function extractCategory(record) {
  return getFirstValue(record, ["category", "cat", "productcategory"]);
}

function extractVendor(record) {
  return getFirstValue(record, [
    "vendor",
    "supplier",
    "vendorname",
    "suppliername",
  ]);
}

function normalizePriceValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const cleaned = String(value).trim().replace(/,/g, "");
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractPrice(record) {
  const raw = getFirstValue(record, ["price", "rate", "amount", "cost"]);
  return normalizePriceValue(raw);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayLabel(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getDuplicateRecordIds(groups) {
  return [
    ...new Set(
      groups.flatMap((group) =>
        (group.records || []).map((record) => String(record._id)),
      ),
    ),
  ];
}

export async function uploadPriceList(req, res) {
  try {
    const { format, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: true, message: "Content required" });
    }

    let records = [];

    if (format === "csv") {
      records = parseCSV(content);
    } else if (format === "json") {
      records = JSON.parse(content);
    } else {
      return res
        .status(400)
        .json({ error: true, message: "Unsupported format" });
    }

    // Map to PriceList fields and skip rows without PL number.
    const priceListRecords = records
      .map((r) => {
        const plNumber = extractPLNumber(r);

        return {
          plNumber,
          description: extractDescription(r),
          category: extractCategory(r),
          price: extractPrice(r),
          vendor: extractVendor(r),
          norm: normalizePLNumber(plNumber),
          status: "active",
        };
      })
      .filter((r) => r.plNumber);

    if (priceListRecords.length === 0) {
      return res.status(400).json({
        error: true,
        message:
          "No valid PL Number values found. Ensure your file includes a PL Number column and non-empty values.",
      });
    }

    await PriceList.insertMany(priceListRecords);

    const skippedCount = records.length - priceListRecords.length;
    const message =
      skippedCount > 0
        ? `Uploaded ${priceListRecords.length} records. Skipped ${skippedCount} rows with missing PL Number.`
        : `Uploaded ${priceListRecords.length} records`;

    res.json({
      success: true,
      message,
      count: priceListRecords.length,
      skipped: skippedCount,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function getPrices(req, res) {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let records = [];
    let total = 0;

    if (status === "duplicate") {
      const activeRecords = await PriceList.find({
        status: { $ne: "removed" },
      });
      const duplicateGroups = findScoredDuplicateGroups(activeRecords);
      const duplicateIds = getDuplicateRecordIds(duplicateGroups);

      const duplicateFilter = {
        $and: [
          { status: { $ne: "removed" } },
          { $or: [{ _id: { $in: duplicateIds } }, { status: "duplicate" }] },
        ],
      };

      if (search) {
        duplicateFilter.$and.push({
          $or: [
            { plNumber: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        });
      }

      records = await PriceList.find(duplicateFilter)
        .skip(skip)
        .limit(parseInt(limit));
      total = await PriceList.countDocuments(duplicateFilter);
    } else {
      const filter = {};

      // Preserve previous default behavior (exclude removed) only when
      // status is omitted. Explicit "all" should include every status.
      if (!status) {
        filter.status = { $ne: "removed" };
      } else if (status !== "all") {
        filter.status = status;
      }

      if (search) {
        filter.$or = [
          { plNumber: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      records = await PriceList.find(filter).skip(skip).limit(parseInt(limit));
      total = await PriceList.countDocuments(filter);
    }

    res.json({
      data: records,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function createPrice(req, res) {
  try {
    const { plNumber, description, category, price, vendor } = req.body;

    if (!plNumber) {
      return res
        .status(400)
        .json({ error: true, message: "PL Number required" });
    }

    const record = new PriceList({
      plNumber,
      description,
      category,
      price: normalizePriceValue(price),
      vendor,
      norm: normalizePLNumber(plNumber),
      status: "active",
    });

    await record.save();

    res.status(201).json({ data: record });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function updatePrice(req, res) {
  try {
    const { id } = req.params;
    const { plNumber, description, category, price, vendor, status } = req.body;

    const normalizedPrice = normalizePriceValue(price);

    const record = await PriceList.findByIdAndUpdate(
      id,
      {
        plNumber: plNumber || undefined,
        description: description || undefined,
        category: category || undefined,
        vendor: vendor || undefined,
        price:
          price === undefined || price === null || String(price).trim() === ""
            ? undefined
            : normalizedPrice,
        status: status || undefined,
        norm: plNumber ? normalizePLNumber(plNumber) : undefined,
      },
      { new: true },
    );

    if (!record) {
      return res.status(404).json({ error: true, message: "Record not found" });
    }

    res.json({ data: record });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function deletePrice(req, res) {
  try {
    const { id } = req.params;

    const record = await PriceList.findByIdAndUpdate(
      id,
      { status: "removed" },
      { new: true },
    );

    if (!record) {
      return res.status(404).json({ error: true, message: "Record not found" });
    }

    res.json({ data: record });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function getDuplicateGroups(req, res) {
  try {
    const records = await PriceList.find({ status: { $ne: "removed" } });

    const duplicates = findScoredDuplicateGroups(records);

    res.json({
      data: {
        duplicates: duplicates.map((group) => ({
          norm:
            group.norm || normalizePLNumber(group.records?.[0]?.plNumber || ""),
          records: group.records || [],
          count: group.count || group.records?.length || 0,
          matchScore: group.matchScore || 100,
          reason: group.reason || "PL number matches after normalization",
          type: group.type || "exact",
        })),
        totalGroups: duplicates.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function removeDuplicate(req, res) {
  try {
    const { id } = req.params;
    const { action, keepId, removeId } = req.body;
    let updated = null;

    if (action === "merge" && keepId && removeId) {
      updated = await PriceList.findByIdAndUpdate(removeId, {
        status: "removed",
      });
      await ResolutionHistory.create({
        action: "merge",
        keepId,
        removeId,
        performedBy: "user",
      });
    } else {
      updated = await PriceList.findByIdAndUpdate(id, { status: "removed" });
      await ResolutionHistory.create({
        action: "delete",
        removeId: id,
        performedBy: "user",
      });
    }

    if (!updated) {
      return res.status(404).json({ error: true, message: "Record not found" });
    }

    res.json({ success: true, message: "Duplicate resolved" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function resolveDuplicate(req, res) {
  try {
    const { action, keepId, removeId } = req.body;

    if (action === "merge" && keepId && removeId) {
      await PriceList.findByIdAndUpdate(removeId, { status: "removed" });
    } else if (action === "delete" && removeId) {
      await PriceList.findByIdAndUpdate(removeId, { status: "removed" });
    }

    await ResolutionHistory.create({
      action,
      keepId: action === "merge" ? keepId : undefined,
      removeId,
      performedBy: "user",
    });

    res.json({ success: true, message: "Resolution recorded" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function getPriceStats(req, res) {
  try {
    const allRecords = await PriceList.find();
    const activeRecords = await PriceList.find({ status: "active" });
    const duplicateGroups = findScoredDuplicateGroups(activeRecords);
    const duplicateRecordIds = getDuplicateRecordIds(duplicateGroups);
    const resolutions = await ResolutionHistory.countDocuments();

    const duplicateRecordCount = duplicateRecordIds.length;
    const cleanRecords = Math.max(
      0,
      activeRecords.length - duplicateRecordCount,
    );
    const qualityPercent = activeRecords.length
      ? Math.round((cleanRecords / activeRecords.length) * 100)
      : 100;

    const now = new Date();
    const uploadTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = startOfDay(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - i),
      );
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const count = allRecords.filter((record) => {
        const createdAt = record.createdAt ? new Date(record.createdAt) : null;
        return createdAt && createdAt >= day && createdAt < nextDay;
      }).length;

      uploadTrend.push({ label: formatDayLabel(day), count });
    }

    const qualityBreakdown = [
      { label: "Clean", value: cleanRecords },
      { label: "Duplicate", value: duplicateRecordCount },
      {
        label: "Removed",
        value: allRecords.filter((record) => record.status === "removed")
          .length,
      },
    ];

    const stats = {
      totalEntries: allRecords.length,
      active: activeRecords.length,
      duplicatesFound: duplicateGroups.length,
      resolvedCount: resolutions,
      duplicateRecords: duplicateRecordCount,
      cleanRecords,
      qualityPercent,
      uploadTrend,
      qualityBreakdown,
    };

    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function bulkResolveRecords(req, res) {
  try {
    const { action, ids = [], items = [], performedBy = "user" } = req.body;

    if (!["delete", "merge", "mark-duplicate"].includes(action)) {
      return res
        .status(400)
        .json({ error: true, message: "Unsupported bulk action" });
    }

    if (action === "mark-duplicate") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: true, message: "ids required" });
      }

      const result = await PriceList.updateMany(
        { _id: { $in: ids }, status: { $ne: "removed" } },
        { status: "duplicate" },
      );

      return res.json({
        success: true,
        message: `Marked ${result.modifiedCount || 0} records as duplicate`,
        modified: result.modifiedCount || 0,
      });
    }

    if (action === "delete") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: true, message: "ids required" });
      }

      const result = await PriceList.updateMany(
        { _id: { $in: ids } },
        { status: "removed" },
      );

      const historyRows = ids.map((id) => ({
        action: "delete",
        removeId: id,
        performedBy,
      }));
      if (historyRows.length) {
        await ResolutionHistory.insertMany(historyRows);
      }

      return res.json({
        success: true,
        message: `Deleted ${result.modifiedCount || 0} records`,
        modified: result.modifiedCount || 0,
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: true, message: "items required for merge" });
    }

    const removeIds = items.map((item) => item?.removeId).filter(Boolean);

    if (removeIds.length === 0) {
      return res
        .status(400)
        .json({ error: true, message: "removeId required in items" });
    }

    const result = await PriceList.updateMany(
      { _id: { $in: removeIds } },
      { status: "removed" },
    );

    const historyRows = items
      .filter((item) => item?.keepId && item?.removeId)
      .map((item) => ({
        action: "merge",
        keepId: item.keepId,
        removeId: item.removeId,
        performedBy,
      }));

    if (historyRows.length) {
      await ResolutionHistory.insertMany(historyRows);
    }

    return res.json({
      success: true,
      message: `Merged ${result.modifiedCount || 0} records`,
      modified: result.modifiedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function downloadDuplicateReport(req, res) {
  try {
    const records = await PriceList.find({ status: { $ne: "removed" } }).lean();
    const duplicateGroups = findScoredDuplicateGroups(records);

    const rows = duplicateGroups.flatMap((group) => {
      const base = {
        groupKey: group.norm || "",
        duplicateType: group.type || "exact",
        matchScore: group.matchScore || 100,
        reason: group.reason || "PL number matches after normalization",
      };

      return (group.records || []).map((record) => ({
        ...base,
        recordId: String(record._id || ""),
        plNumber: record.plNumber || "",
        description: record.description || "",
        status: record.status || "",
      }));
    });

    const csv = toCSV(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="duplicate-report.csv"',
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function downloadCleaned(req, res) {
  try {
    const records = await PriceList.find({ status: "active" })
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const uniqueByNorm = new Map();

    for (const record of records) {
      const norm = normalizePLNumber(record.plNumber || "");
      if (!norm || uniqueByNorm.has(norm)) {
        continue;
      }

      uniqueByNorm.set(norm, record);
    }

    const cleanedRecords = [...uniqueByNorm.values()];

    const csv = toCSV(
      cleanedRecords.map((r) => ({
        plNumber: r.plNumber,
        description: r.description,
        category: r.category,
        price: r.price,
        vendor: r.vendor,
        norm: r.norm || normalizePLNumber(r.plNumber || ""),
      })),
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="cleaned-prices.csv"',
    );
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}
