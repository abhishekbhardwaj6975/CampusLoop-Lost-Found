/**
 * CampusLoop Smart Matching Algorithm
 * Compares a target item (lost or found) against opposite-type candidates using:
 *  1. Category match (30%)
 *  2. Title & Description TF-IDF cosine + keyword token similarity (35%)
 *  3. Campus Location similarity (20%)
 *  4. Date proximity decay (15%)
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'were', 'are', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'this', 'that', 'these', 'those', 'it', 'its', 'my', 'your',
  'near', 'around', 'inside', 'outside', 'found', 'lost', 'item', 'please', 'contact',
  'return', 'someone', 'left', 'dropped', 'missing', 'very', 'some', 'any', 'into', 'out',
]);

const SYNONYM_MAP = {
  earbuds: 'earphone',
  earbud: 'earphone',
  airpods: 'earphone',
  airpod: 'earphone',
  headphone: 'earphone',
  headphones: 'earphone',
  earphones: 'earphone',
  neckband: 'earphone',
  tws: 'earphone',
  adapter: 'charger',
  charging: 'charger',
  cable: 'charger',
  powerbank: 'powerbank',
  purse: 'wallet',
  cardholder: 'wallet',
  identity: 'idcard',
  id: 'idcard',
  icard: 'idcard',
  lanyard: 'idcard',
  spectacles: 'glasses',
  specs: 'glasses',
  eyeglass: 'glasses',
  eyeglasses: 'glasses',
  sunglasses: 'glasses',
  flask: 'bottle',
  tumbler: 'bottle',
  thermos: 'bottle',
  calc: 'calculator',
  scientific: 'calculator',
  textbook: 'book',
  notebook: 'book',
  books: 'book',
  notes: 'book',
  register: 'book',
  keychain: 'key',
  keys: 'key',
  backpack: 'bag',
  handbag: 'bag',
  laptopbag: 'bag',
  mobile: 'phone',
  smartphone: 'phone',
  iphone: 'phone',
  android: 'phone',
};

const RELATED_CATEGORIES = {
  Electronics: ['Accessories', 'Others'],
  'ID & Cards': ['Wallet & Cash', 'Documents'],
  'Wallet & Cash': ['ID & Cards', 'Accessories'],
  'Books & Notes': ['Stationery', 'Bags'],
  Accessories: ['Electronics', 'Keys', 'Clothing'],
  Keys: ['Accessories', 'Bags'],
  Bags: ['Books & Notes', 'Clothing', 'Accessories'],
  Clothing: ['Accessories', 'Bags'],
  'Water Bottles': ['Accessories', 'Others'],
  Others: ['Accessories'],
};

function stemToken(token) {
  let t = token.toLowerCase().trim();
  if (SYNONYM_MAP[t]) return SYNONYM_MAP[t];
  if (t.length > 4 && t.endsWith('ies')) {
    t = `${t.slice(0, -3)}y`;
  } else if (t.length > 4 && t.endsWith('es')) {
    t = t.slice(0, -2);
  } else if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) {
    t = t.slice(0, -1);
  }
  return SYNONYM_MAP[t] || t;
}

function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
    .map(stemToken);
}

function computeCategoryScore(catA = '', catB = '') {
  const a = catA.trim().toLowerCase();
  const b = catB.trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 1.0;

  const related = RELATED_CATEGORIES[catA] || [];
  if (related.some((r) => r.toLowerCase() === b)) {
    return 0.35;
  }
  return 0;
}

function computeLocationScore(locA = '', locB = '') {
  const a = locA.trim().toLowerCase();
  const b = locB.trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? Math.min(1, (overlap / union) * 1.25) : 0;
}

function computeDateScore(dateA, dateB) {
  if (!dateA || !dateB) return 0.3;
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0.3;

  const diffDays = Math.abs(timeA - timeB) / (1000 * 60 * 60 * 24);
  if (diffDays <= 0.5) return 1.0;
  if (diffDays <= 2) return 0.9;
  if (diffDays <= 5) return 0.78;
  if (diffDays <= 10) return 0.6;
  if (diffDays <= 20) return 0.4;
  if (diffDays <= 35) return 0.22;
  return 0.08;
}

function buildTermFreq(item) {
  // Title tokens weighted 2x for stronger relevance
  const titleTokens = tokenize(item.title);
  const descTokens = tokenize(item.description);
  const tf = new Map();

  for (const t of titleTokens) {
    tf.set(t, (tf.get(t) || 0) + 2);
  }
  for (const t of descTokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

function computeTextSimilarity(targetItem, candidates) {
  const allDocs = [targetItem, ...candidates];
  const docTfs = allDocs.map(buildTermFreq);
  const df = new Map();

  for (const tf of docTfs) {
    for (const term of tf.keys()) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const N = allDocs.length;
  const toTfIdfVector = (tf) => {
    const vec = new Map();
    let totalTerms = 0;
    for (const count of tf.values()) totalTerms += count;
    if (totalTerms === 0) return vec;

    for (const [term, count] of tf.entries()) {
      const idf = Math.log((N + 1) / ((df.get(term) || 1) + 1)) + 1;
      vec.set(term, (count / totalTerms) * idf);
    }
    return vec;
  };

  const targetTf = docTfs[0];
  const targetVec = toTfIdfVector(targetTf);
  const targetNorm = Math.sqrt(
    Array.from(targetVec.values()).reduce((sum, v) => sum + v * v, 0)
  );

  return candidates.map((candidate, idx) => {
    const candTf = docTfs[idx + 1];
    const candVec = toTfIdfVector(candTf);
    const candNorm = Math.sqrt(
      Array.from(candVec.values()).reduce((sum, v) => sum + v * v, 0)
    );

    let dot = 0;
    const matchedKeywords = [];
    for (const [term, val] of targetVec.entries()) {
      if (candVec.has(term)) {
        dot += val * candVec.get(term);
        matchedKeywords.push(term);
      }
    }

    const cosine = targetNorm > 0 && candNorm > 0 ? dot / (targetNorm * candNorm) : 0;

    // Also calculate Dice token overlap for short titles
    const keysA = new Set(targetTf.keys());
    const keysB = new Set(candTf.keys());
    const dice =
      keysA.size + keysB.size > 0
        ? (2 * matchedKeywords.length) / (keysA.size + keysB.size)
        : 0;

    const combined = Math.min(1, cosine * 0.65 + dice * 0.35);
    return {
      textScore: combined,
      matchedKeywords: matchedKeywords.slice(0, 6),
    };
  });
}

function findSmartMatches(targetItem, candidates, { limit = 5, minScore = 20 } = {}) {
  if (!targetItem || !Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const textResults = computeTextSimilarity(targetItem, candidates);

  const scored = candidates.map((candidate, idx) => {
    const categoryScore = computeCategoryScore(targetItem.category, candidate.category);
    const { textScore, matchedKeywords } = textResults[idx];
    const locationScore = computeLocationScore(targetItem.location, candidate.location);
    const dateScore = computeDateScore(targetItem.date, candidate.date);

    // Weighted combination
    const rawScore =
      categoryScore * 0.30 +
      textScore * 0.35 +
      locationScore * 0.20 +
      dateScore * 0.15;

    const score = Math.min(99, Math.max(0, Math.round(rawScore * 100)));

    const reasons = [];
    if (categoryScore === 1) {
      reasons.push(`Same category (${candidate.category})`);
    } else if (categoryScore > 0) {
      reasons.push(`Related category (${candidate.category})`);
    }
    if (matchedKeywords.length > 0) {
      reasons.push(`Keywords: ${matchedKeywords.slice(0, 4).join(', ')}`);
    }
    if (locationScore >= 0.7) {
      reasons.push(`Similar location (${candidate.location})`);
    } else if (locationScore >= 0.35) {
      reasons.push(`Nearby area (${candidate.location})`);
    }
    if (dateScore >= 0.78) {
      reasons.push('Reported around the same date');
    }

    return {
      item: candidate,
      score,
      breakdown: {
        category: Math.round(categoryScore * 100),
        keywords: Math.round(textScore * 100),
        location: Math.round(locationScore * 100),
        date: Math.round(dateScore * 100),
      },
      matchedKeywords,
      reasons,
    };
  });

  return scored
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { findSmartMatches };

