import PriceList from "../models/PriceList.js";
import ResolutionHistory from "../models/ResolutionHistory.js";
import { parseCSV, toCSV } from "../utils/csvParser.js";
import {
  findExactDuplicateGroups,
  normalizePLNumber,
} from "../utils/duplicateChecker.js";

function getFirstValue(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function extractPLNumber(record) {
  return getFirstValue(record, [
    "plNumber",
    "pl_number",
    "pl number",
    "plno",
    "pl_no",
    "pl",
  ]);
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
          description: getFirstValue(r, ["description", "desc"]),
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

    const filter = { status: { $ne: "removed" } };

    if (search) {
      filter.$or = [
        { plNumber: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const records = await PriceList.find(filter)
      .skip(skip)
      .limit(parseInt(limit));
    const total = await PriceList.countDocuments(filter);

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
    const { plNumber, description } = req.body;

    if (!plNumber) {
      return res
        .status(400)
        .json({ error: true, message: "PL Number required" });
    }

    const record = new PriceList({
      plNumber,
      description,
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
    const { plNumber, description, status } = req.body;

    const record = await PriceList.findByIdAndUpdate(
      id,
      {
        plNumber: plNumber || undefined,
        description: description || undefined,
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

    const duplicates = findExactDuplicateGroups(records);

    res.json({
      data: {
        duplicates: duplicates.map((group) => ({
          norm: normalizePLNumber(group[0].plNumber),
          records: group,
          count: group.length,
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

    if (action === "delete") {
      await PriceList.findByIdAndUpdate(id, { status: "removed" });
    } else if (action === "merge" && keepId && removeId) {
      await PriceList.findByIdAndUpdate(removeId, { status: "removed" });
      await ResolutionHistory.create({
        action: "merge",
        keepId,
        removeId,
        performedBy: "user",
      });
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
    const duplicateGroups = findExactDuplicateGroups(activeRecords);
    const resolutions = await ResolutionHistory.countDocuments();

    const stats = {
      totalEntries: allRecords.length,
      active: activeRecords.length,
      duplicatesFound: duplicateGroups.length,
      resolvedCount: resolutions,
    };

    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}

export async function downloadCleaned(req, res) {
  try {
    const records = await PriceList.find({ status: "active" }).lean();

    const csv = toCSV(
      records.map((r) => ({
        plNumber: r.plNumber,
        description: r.description,
        norm: r.norm,
      })),
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="cleaned-prices.csv"',
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
}
