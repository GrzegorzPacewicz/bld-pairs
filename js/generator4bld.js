import {
  CORNERS_4BLD, WINGS, CENTERS,
  CORNER_VARIANTS, WINGS_WEIGHTS, CENTERS_WEIGHTS,
  weightedRandom, weightedRandomVariant, shuffle
} from "./schema.js";
import { generateCorners } from "./generator3bld.js";

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

export function generate4BLDSession(mode, cornerCount, wingsCount, centersCount) {
  let variant;
  if (cornerCount === "?") {
    variant = weightedRandomVariant(CORNER_VARIANTS);
  } else {
    const cc = typeof cornerCount === "string" ? parseInt(cornerCount) : cornerCount;
    const withSingiel = Math.random() < 0.5;
    const variantName = withSingiel && cc <= 4 ? `${cc}+1` : String(cc);
    variant = CORNER_VARIANTS.find((v) => v.variant === variantName);
    if (!variant) {
      variant = CORNER_VARIANTS.find((v) => v.variant === String(cc)) || CORNER_VARIANTS[2];
    }
  }

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
    const result = generateCorners(CORNERS_4BLD, variant);
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
