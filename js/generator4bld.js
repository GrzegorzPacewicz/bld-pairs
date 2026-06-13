import {
  CORNERS_4BLD, WINGS, CENTERS,
  CORNER_WEIGHTS, WINGS_WEIGHTS, CENTERS_WEIGHTS,
  weightedRandom, shuffle
} from "./schema.js";
import { generatePairsForType } from "./generator.js";

function generateWingsPairs(count, withSingiel) {
  const pairs = [];
  const used = new Set();
  const letters = WINGS.map(g => g[0]);

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

function generateCentersPairs(count, withSingiel) {
  const pairs = [];
  const used = new Set();
  const letters = CENTERS.map(g => g[0]);

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
  const letters = WINGS.map(g => g[0]);
  const shuffled = shuffle(letters);

  const repeatLetter = shuffled[Math.floor(Math.random() * shuffled.length)];
  const allLetters = [...shuffled, repeatLetter];
  const finalShuffle = shuffle(allLetters);

  const pairs = [];
  for (let i = 0; i < 12; i++) {
    pairs.push([finalShuffle[i * 2], finalShuffle[i * 2 + 1]]);
  }

  return { pairs, singiel: null };
}

export function generate4BLDSession(mode, cornerCount, wingsCount, centersCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const wc = wingsCount === "?" ? weightedRandom(WINGS_WEIGHTS) : wingsCount;

  let centersBaseCount;
  if (centersCount === "?") {
    centersBaseCount = weightedRandom(CENTERS_WEIGHTS);
  } else {
    centersBaseCount = centersCount;
  }

  let cornerPairs = [];
  let cornerSingiel = null;

  if (mode === "corners" || mode === "mixed") {
    const willHaveSingiel = Math.random() < 0.5;
    const effectiveCc = willHaveSingiel ? cc - 1 : cc;
    const cornerModeA = effectiveCc <= 3;
    cornerPairs = generatePairsForType("corners4", effectiveCc, cornerModeA);

    if (willHaveSingiel) {
      const usedPieces = new Set();
      cornerPairs.forEach(([a, b]) => {
        for (const g of CORNERS_4BLD) {
          if (g.includes(a)) usedPieces.add(g.join(""));
          if (g.includes(b)) usedPieces.add(g.join(""));
        }
      });
      if (!cornerModeA) {
        const lastLetter = cornerPairs.length > 0 ? cornerPairs[cornerPairs.length - 1][1] : null;
        const candidates = CORNERS_4BLD
          .filter((g) => usedPieces.has(g.join("")))
          .flatMap((g) => g)
          .filter((l) => l !== lastLetter);
        if (candidates.length > 0) {
          cornerSingiel = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          cornerPairs = generatePairsForType("corners4", cc, cornerModeA);
        }
      } else {
        const unusedPieces = CORNERS_4BLD.filter((g) => !usedPieces.has(g.join("")));
        if (unusedPieces.length > 0) {
          const piece = unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
          cornerSingiel = piece[Math.floor(Math.random() * piece.length)];
        } else {
          cornerPairs = generatePairsForType("corners4", cc, cornerModeA);
        }
      }
    }
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
    }
  }

  let centersPairs = [];
  let centersSingiel = null;

  if (mode === "centers" || mode === "mixed") {
    const canHaveSingiel = centersBaseCount <= 7;
    const willHaveSingiel = canHaveSingiel && Math.random() < 0.5;

    if (willHaveSingiel) {
      const result = generateCentersPairs(centersBaseCount, true);
      centersPairs = result.pairs;
      centersSingiel = result.singiel;
    } else {
      const result = generateCentersPairs(centersBaseCount, false);
      centersPairs = result.pairs;
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

  const centersItems = [
    ...centersPairs.map((p) => ({ pair: p, type: "center" })),
    ...(centersSingiel ? [{ pair: [centersSingiel], type: "center-single" }] : []),
  ];

  return {
    displayPairs: [...cornerItems, ...wingsItems, ...centersItems],
    answerPairs: [...centersItems, ...wingsItems, ...cornerItems],
  };
}
