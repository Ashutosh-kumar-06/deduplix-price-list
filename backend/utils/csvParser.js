export function parseCSV(csvContent) {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2)
    throw new Error("CSV file must have at least headers and one row");

  const headers = lines[0]
    .split(",")
    .map((h) =>
      h
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^"|"$/g, ""),
    )
    .map((h) => h.toLowerCase());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
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

  records.forEach((record) => {
    const values = headers.map((h) => `"${record[h] || ""}"`);
    rows.push(values.join(","));
  });

  return rows.join("\n");
}
