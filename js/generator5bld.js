import {
  CORNERS_5BLD, WINGS_5BLD, MIDGES, TCENTERS, XCENTERS,
  CORNER_VARIANTS, WINGS_5BLD_WEIGHTS, MIDGES_VARIANTS,
  TCENTERS_WEIGHTS, XCENTERS_WEIGHTS,
  weightedRandom, weightedRandomVariant, shuffle
} from "./schema.js";
import { generateCorners } from "./generator3bld.js";
import { generatePairsForType } from "./generator.js";

function generateWingsPairs(count, withSingiel) {
  const pairs = [];
  const used = new Set();
  const letters = WINGS_5BLD.map(g => g[0]);

  for (let i = 0; i < count; i++) {
    const available = letters.filter(l => !used.has(l));
    if (available.length < 2) break;

    const shuffled = shuffle(available);
    const a = shuffled[0];
    const b = shuffled[1];
    pairs.push([a, b]);
    used.add(a);
    used.add(b);
  }

  let singiel = null;
  if (withSingiel) {
    const remaining = letters.filter(l => !used.has(l));
    if (remaining.length > 0) {
      singiel = remaining[Math.floor(Math.random() * remaining.length)];
    }
  }

  return { pairs, singiel };
}

function generateWingsPairsWithRepeat() {
  const letters = WINGS_5BLD.map(g => g[0]);

  for (let attempt = 0; attempt < 500; attempt++) {
    const shuffled = shuffle([...letters]);
    const repeatLetter = shuffled[Math.floor(Math.random() * 23)];

    const allLetters = [...shuffled, repeatLetter];
    const finalShuffle = shuffle(allLetters);

    const pairs = [];
    let valid = true;
    let repeatPairIndices = [];

    for (let i = 0; i < 12; i++) {
      const first = finalShuffle[i * 2];
      const second = finalShuffle[i * 2 + 1];

      if (first === second) {
        valid = false;
        break;
      }

      if (i > 0) {
        const prevSecond = pairs[i - 1][1];
        if (first === prevSecond) {
          valid = false;
          break;
        }
      }

      if (first === repeatLetter || second === repeatLetter) {
        repeatPairIndices.push(i);
      }

      pairs.push([first, second]);
    }

    if (!valid || pairs.length !== 12) continue;
    if (repeatPairIndices.length !== 2) continue;

    const [idx1, idx2] = repeatPairIndices;
    if (Math.abs(idx1 - idx2) <= 1) continue;

    const lastSecond = pairs[11][1];
    const firstFirst = pairs[0][0];
    if (lastSecond === firstFirst) continue;

    return { pairs, singiel: null };
  }

  return generateWingsPairs(11, true);
}

function getGroupForLetter(letter, schema) {
  for (const group of schema) {
    if (group.includes(letter)) return group;
  }
  return null;
}

function generateCentersPairs(count, withSingiel, schema) {
  const allLetters = schema.flat();

  for (let attempt = 0; attempt < 500; attempt++) {
    const pairs = [];
    const used = new Set();
    let lastLetter = null;
    let valid = true;

    for (let i = 0; i < count; i++) {
      const lastGroup = lastLetter ? getGroupForLetter(lastLetter, schema) : null;

      const available = allLetters.filter(l => {
        if (used.has(l)) return false;
        if (lastGroup && lastGroup.includes(l)) return false;
        return true;
      });

      if (available.length < 2) {
        valid = false;
        break;
      }

      const shuffled = shuffle(available);
      let a = null;
      let b = null;

      for (const candidateA of shuffled) {
        const groupA = getGroupForLetter(candidateA, schema);
        for (const candidateB of shuffled) {
          if (candidateA === candidateB) continue;
          if (groupA && groupA.includes(candidateB)) continue;
          a = candidateA;
          b = candidateB;
          break;
        }
        if (a && b) break;
      }

      if (!a || !b) {
        valid = false;
        break;
      }

      pairs.push([a, b]);
      used.add(a);
      used.add(b);
      lastLetter = b;
    }

    if (!valid || pairs.length !== count) continue;

    let singiel = null;
    if (withSingiel) {
      const lastGroup = lastLetter ? getGroupForLetter(lastLetter, schema) : null;
      const remaining = allLetters.filter(l => {
        if (used.has(l)) return false;
        if (lastGroup && lastGroup.includes(l)) return false;
        return true;
      });
      if (remaining.length > 0) {
        singiel = remaining[Math.floor(Math.random() * remaining.length)];
      } else {
        continue;
      }
    }

    return { pairs, singiel };
  }

  return { pairs: [], singiel: null };
}

function generateMidges(variant) {
  const { pairs: pairCount, singiel: hasSingiel } = variant;

  if (!hasSingiel) {
    const modeA = pairCount <= 5;
    return { pairs: generatePairsForType("midges", pairCount, modeA), singiel: null };
  }

  if (pairCount === 5) {
    const pairs = generatePairsForType("midges", 5, true);
    const usedPieces = new Set();
    pairs.forEach(([a, b]) => {
      for (const g of MIDGES) {
        if (g.includes(a)) usedPieces.add(g.join(""));
        if (g.includes(b)) usedPieces.add(g.join(""));
      }
    });
    const unusedPieces = MIDGES.filter((g) => !usedPieces.has(g.join("")));
    if (unusedPieces.length > 0) {
      const piece = unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
      const singiel = piece[Math.floor(Math.random() * piece.length)];
      return { pairs, singiel };
    }
    return { pairs, singiel: null };
  }

  if (pairCount === 6) {
    return generateMidges6Plus1();
  }

  return { pairs: generatePairsForType("midges", pairCount, false), singiel: null };
}

function generateMidges6Plus1() {
  const pairs = generatePairsForType("midges", 6, false);

  const usedLetters = new Set();
  const usedPieces = new Set();
  pairs.forEach(([a, b]) => {
    usedLetters.add(a);
    usedLetters.add(b);
    for (const g of MIDGES) {
      if (g.includes(a)) usedPieces.add(g.join(""));
      if (g.includes(b)) usedPieces.add(g.join(""));
    }
  });

  const lastLetter = pairs[pairs.length - 1][1];
  const singielCandidates = [];
  for (const key of usedPieces) {
    const group = MIDGES.find((g) => g.join("") === key);
    for (const l of group) {
      if (!usedLetters.has(l) && l !== lastLetter) {
        singielCandidates.push(l);
      }
    }
  }

  if (singielCandidates.length === 0) {
    return { pairs, singiel: null };
  }

  const singiel = singielCandidates[Math.floor(Math.random() * singielCandidates.length)];
  return { pairs, singiel };
}

export function generate5BLDSession(mode, cornerCount, wingsCount, midgesCount, tcentersCount, xcentersCount) {
  let variant;
  if (cornerCount === "?") {
    variant = weightedRandomVariant(CORNER_VARIANTS);
  } else {
    const cc = typeof cornerCount === "string" ? parseInt(cornerCount) : cornerCount;
    const withSingiel = Math.random() < 0.5;
    const variantName = withSingiel && cc >= 3 ? `${cc - 1}+1` : String(cc);
    variant = CORNER_VARIANTS.find((v) => v.variant === variantName);
    if (!variant) {
      variant = CORNER_VARIANTS.find((v) => v.variant === String(cc)) || CORNER_VARIANTS[2];
    }
  }

  const wc = wingsCount === "?" ? weightedRandom(WINGS_5BLD_WEIGHTS) : wingsCount;

  let tcentersBaseCount;
  if (tcentersCount === "?") {
    tcentersBaseCount = weightedRandom(TCENTERS_WEIGHTS);
  } else {
    tcentersBaseCount = tcentersCount;
  }

  let xcentersBaseCount;
  if (xcentersCount === "?") {
    xcentersBaseCount = weightedRandom(XCENTERS_WEIGHTS);
  } else {
    xcentersBaseCount = xcentersCount;
  }

  let cornerPairs = [];
  let cornerSingiel = null;

  if (mode === "corners" || mode === "mixed") {
    const result = generateCorners(CORNERS_5BLD, variant);
    cornerPairs = result.pairs;
    cornerSingiel = result.singiel;
  }

  let wingsPairs = [];
  let wingsSingiel = null;

  if (mode === "wings" || mode === "mixed") {
    if (wc === 11) {
      const result = generateWingsPairs(11, true);
      wingsPairs = result.pairs;
      wingsSingiel = result.singiel;
    } else {
      const result = generateWingsPairsWithRepeat();
      wingsPairs = result.pairs;
      wingsSingiel = result.singiel;
    }
  }

  let midgesPairs = [];
  let midgesSingiel = null;

  if (mode === "midges" || mode === "mixed") {
    const needOddMidges = mode === "mixed" ? (cornerSingiel !== null) : Math.random() < 0.5;

    let midgesVariant;
    if (midgesCount === "?") {
      const candidates = MIDGES_VARIANTS.filter((v) => v.singiel === needOddMidges);
      midgesVariant = weightedRandomVariant(candidates);
    } else {
      const mc = typeof midgesCount === "string" ? parseInt(midgesCount) : midgesCount;
      const variantName = needOddMidges ? `${mc}+1` : String(mc);
      midgesVariant = MIDGES_VARIANTS.find((v) => v.variant === variantName);
      if (!midgesVariant) {
        midgesVariant = MIDGES_VARIANTS.find((v) => v.variant === String(mc)) || MIDGES_VARIANTS[1];
      }
    }

    const result = generateMidges(midgesVariant);
    midgesPairs = result.pairs;
    midgesSingiel = result.singiel;
  }

  let tcentersPairs = [];
  let tcentersSingiel = null;

  if (mode === "tcenters" || mode === "mixed") {
    const canHaveSingiel = tcentersBaseCount <= 8;
    const willHaveSingiel = canHaveSingiel && Math.random() < 0.5;

    if (willHaveSingiel) {
      const result = generateCentersPairs(tcentersBaseCount, true, TCENTERS);
      tcentersPairs = result.pairs;
      tcentersSingiel = result.singiel;
    } else {
      const result = generateCentersPairs(tcentersBaseCount, false, TCENTERS);
      tcentersPairs = result.pairs;
    }
  }

  let xcentersPairs = [];
  let xcentersSingiel = null;

  if (mode === "xcenters" || mode === "mixed") {
    const canHaveSingiel = xcentersBaseCount <= 8;
    const willHaveSingiel = canHaveSingiel && Math.random() < 0.5;

    if (willHaveSingiel) {
      const result = generateCentersPairs(xcentersBaseCount, true, XCENTERS);
      xcentersPairs = result.pairs;
      xcentersSingiel = result.singiel;
    } else {
      const result = generateCentersPairs(xcentersBaseCount, false, XCENTERS);
      xcentersPairs = result.pairs;
    }
  }

  const cornerItems = [
    ...cornerPairs.map((p) => ({ pair: p, type: "corner" })),
    ...(cornerSingiel ? [{ pair: [cornerSingiel], type: "corner-single" }] : []),
  ];

  const wingsItems = [
    ...wingsPairs.map((p) => ({ pair: p, type: "wing" })),
    ...(wingsSingiel ? [{ pair: [wingsSingiel], type: "wing-single" }] : []),
  ];

  const midgesItems = [
    ...midgesPairs.map((p) => ({ pair: p, type: "midge" })),
    ...(midgesSingiel ? [{ pair: [midgesSingiel], type: "midge-single" }] : []),
  ];

  const tcentersItems = [
    ...tcentersPairs.map((p) => ({ pair: p, type: "tcenter" })),
    ...(tcentersSingiel ? [{ pair: [tcentersSingiel], type: "tcenter-single" }] : []),
  ];

  const xcentersItems = [
    ...xcentersPairs.map((p) => ({ pair: p, type: "xcenter" })),
    ...(xcentersSingiel ? [{ pair: [xcentersSingiel], type: "xcenter-single" }] : []),
  ];

  return {
    displayPairs: [...cornerItems, ...wingsItems, ...midgesItems, ...tcentersItems, ...xcentersItems],
    answerPairs: [...xcentersItems, ...tcentersItems, ...midgesItems, ...wingsItems, ...cornerItems],
  };
}
