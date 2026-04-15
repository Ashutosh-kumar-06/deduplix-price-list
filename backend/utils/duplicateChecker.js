export function normalizePLNumber(plNumber) {
  return plNumber
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function findExactDuplicateGroups(records) {
  const groups = {};

  records.forEach((record) => {
    const normalized = normalizePLNumber(record.plNumber);
    if (!groups[normalized]) {
      groups[normalized] = [];
    }
    groups[normalized].push(record);
  });

  // Return only groups with > 1 record
  return Object.values(groups).filter((group) => group.length > 1);
}
