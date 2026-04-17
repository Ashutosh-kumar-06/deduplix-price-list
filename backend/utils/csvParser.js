function detectDelimiter(headerLine) {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;

  for (const delimiter of candidates) {
    const count = headerLine.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }

  return best;
}

function splitCSVLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCSV(csvContent) {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2)
    throw new Error("CSV file must have at least headers and one row");

  const delimiter = detectDelimiter(lines[0]);

  const headers = lines[0]
    .replace(/\r$/, "")
    .split(delimiter)
    .map((h) =>
      h
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^"|"$/g, ""),
    )
    .map((h) => h.toLowerCase());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i].replace(/\r$/, ""), delimiter);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    records.push(record);
  }

  return records;
}

export function toCSV(records) {
  if (!records || records.length === 0) return "";

  const headers = Object.keys(records[0]);
  const rows = [headers.join(",")];

  const escapeCSVValue = (value) => {
    const normalized =
      value === undefined || value === null ? "" : String(value);
    return `"${normalized.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  };

  records.forEach((record) => {
    const values = headers.map((h) => escapeCSVValue(record[h]));
    rows.push(values.join(","));
  });

  return rows.join("\n");
}
