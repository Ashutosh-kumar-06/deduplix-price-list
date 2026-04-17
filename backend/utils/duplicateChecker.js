export function normalizePLNumber(plNumber) {
  return plNumber
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function levenshteinDistance(a, b) {
  const s = String(a);
  const t = String(b);

  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const rows = s.length + 1;
  const cols = t.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[s.length][t.length];
}

function similarityPercent(a, b) {
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 100;
  const distance = levenshteinDistance(a, b);
  return Math.round((1 - distance / maxLen) * 100);
}

function getDuplicateScore(a, b) {
  const aPL = normalizePLNumber(a.plNumber || "");
  const bPL = normalizePLNumber(b.plNumber || "");
  const aDesc = normalizeText(a.description || "");
  const bDesc = normalizeText(b.description || "");

  const plScore = similarityPercent(aPL, bPL);
  const descScore = similarityPercent(aDesc, bDesc);
  const score = Math.round(plScore * 0.75 + descScore * 0.25);

  if (aPL && aPL === bPL) {
    return {
      score: 100,
      reason: "PL number matches after case/symbol normalization",
      type: "exact",
    };
  }

  if (score >= 88) {
    return {
      score,
      reason: "PL number and description are highly similar",
      type: "fuzzy",
    };
  }

  return null;
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

export function findScoredDuplicateGroups(records) {
  const exactGroups = findExactDuplicateGroups(records).map((group) => ({
    norm: normalizePLNumber(group[0].plNumber),
    records: group,
    count: group.length,
    matchScore: 100,
    reason: "PL number matches after case/symbol normalization",
    type: "exact",
  }));

  const exactIds = new Set(
    exactGroups.flatMap((group) => group.records.map((r) => String(r._id))),
  );

  const candidates = records.filter((r) => !exactIds.has(String(r._id)));
  const used = new Set();
  const fuzzyGroups = [];

  for (let i = 0; i < candidates.length; i++) {
    const left = candidates[i];
    const leftId = String(left._id);
    if (used.has(leftId)) continue;

    let bestIdx = -1;
    let bestMatch = null;

    for (let j = i + 1; j < candidates.length; j++) {
      const right = candidates[j];
      const rightId = String(right._id);
      if (used.has(rightId)) continue;

      const match = getDuplicateScore(left, right);
      if (!match) continue;

      if (!bestMatch || match.score > bestMatch.score) {
        bestMatch = match;
        bestIdx = j;
      }
    }

    if (bestIdx >= 0 && bestMatch) {
      const right = candidates[bestIdx];
      const rightId = String(right._id);
      used.add(leftId);
      used.add(rightId);

      fuzzyGroups.push({
        norm: normalizePLNumber(left.plNumber || right.plNumber || ""),
        records: [left, right],
        count: 2,
        matchScore: bestMatch.score,
        reason: bestMatch.reason,
        type: bestMatch.type,
      });
    }
  }

  return [...exactGroups, ...fuzzyGroups].sort(
    (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
  );
}
