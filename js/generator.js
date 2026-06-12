import {
  CORNERS, EDGES,
  CORNER_WEIGHTS, EDGE_WEIGHTS,
  weightedRandom, shuffle, getBlockedLetters
} from "./schema.js";

function _tryGenPairs(schema, count, blockingLimit, applyCycleClosure, isCorners) {
  const pairs = [];
  const pieceState = new Map(schema.map((g, idx) => [g.join(""), { uses: 0, firstUsedAt: -1, index: idx }]));
  const groupBlocked = new Set();
  const loopBlocked = new Set();
  const usageOrder = [];

  let attempts = 0;
  while (pairs.length < count && attempts < 1000) {
    attempts++;

    const prevSecondLetter = pairs.length > 0 ? pairs[pairs.length - 1][1] : null;
    const isLastPair = pairs.length === count - 1;
    const applyBlock = pairs.length < blockingLimit;
    const isPair3Plus = pairs.length >= 2;

    const avail = [];
    for (const group of schema) {
      const key = group.join("");
      const ps = pieceState.get(key);
      if (ps.uses >= 2) continue;
      for (const letter of group) {
        if (applyBlock && groupBlocked.has(letter)) continue;
        if (loopBlocked.has(letter)) continue;
        avail.push({ letter, pieceKey: key, isRepeat: ps.uses >= 1, firstUsedAt: ps.firstUsedAt });
      }
    }

    let availFirst = avail.filter((x) => x.letter !== prevSecondLetter);

    if (isCorners && applyCycleClosure && isPair3Plus) {
      if (isLastPair) {
        availFirst = availFirst.filter((x) => !x.isRepeat);
      } else {
        availFirst = availFirst.filter((x) => x.isRepeat);
      }
    }

    availFirst = shuffle(availFirst);
    if (availFirst.length === 0) return null;

    let placed = false;
    for (const first of availFirst) {
      let candidates = avail.filter((x) => {
        if (x.pieceKey === first.pieceKey) return false;
        const pk = [first.letter, x.letter].sort().join("-");
        if (pairs.some(([a, b]) => [a, b].sort().join("-") === pk)) return false;
        return true;
      });

      if (isCorners && applyCycleClosure && isPair3Plus) {
        if (isLastPair) {
          candidates = candidates.filter((x) => x.isRepeat && x.firstUsedAt >= 3);
        } else {
          candidates = candidates.filter((x) => !x.isRepeat);
        }
      } else if (applyCycleClosure && isLastPair) {
        candidates = candidates.filter((x) => x.isRepeat);
      }

      if (candidates.length === 0) continue;

      const second = candidates[Math.floor(Math.random() * candidates.length)];
      pairs.push([first.letter, second.letter]);

      const firstPs = pieceState.get(first.pieceKey);
      if (firstPs.uses === 0) firstPs.firstUsedAt = pairs.length;
      firstPs.uses++;

      const secondPs = pieceState.get(second.pieceKey);
      if (secondPs.uses === 0) secondPs.firstUsedAt = pairs.length;
      secondPs.uses++;

      if (!isCorners && applyCycleClosure) {
        for (const ps of [firstPs, secondPs]) {
          if (ps.uses === 1) {
            usageOrder.push(ps.index);
          } else if (ps.uses === 2) {
            const firstIdx = usageOrder.indexOf(ps.index);
            if (firstIdx !== -1) {
              const piecesBetween = usageOrder.slice(firstIdx + 1);
              for (const idx of piecesBetween) {
                schema[idx].forEach((l) => loopBlocked.add(l));
              }
            }
          }
        }
      }

      if (applyBlock) {
        getBlockedLetters([first.letter, second.letter], schema).forEach((l) =>
          groupBlocked.add(l)
        );
      }
      placed = true;
      break;
    }
    if (!placed) return null;
  }

  return pairs.length === count ? pairs : null;
}

export function generatePairsForType(type, count, modeA) {
  const schema = type === "corners" ? CORNERS : EDGES;
  const isCorners = type === "corners";
  const isModeA =
    modeA !== undefined ? modeA : (isCorners ? count <= 3 : count <= 5);
  const blockingLimit = isModeA ? Infinity : 2;
  const applyCycleClosure = !isModeA;

  for (let attempt = 0; attempt < 200; attempt++) {
    const result = _tryGenPairs(schema, count, blockingLimit, applyCycleClosure, isCorners);
    if (result) return result;
  }
  if (applyCycleClosure) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const result = _tryGenPairs(schema, count, blockingLimit, false, isCorners);
      if (result) return result;
    }
  }
  return [];
}

export function generateSession(mode, cornerCount, edgeCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;

  const edgeModeA = ec <= 5;

  const willHaveSingiel =
    (mode === "corners" || mode === "mixed") && Math.random() < 0.5;

  let cornerPairs = [];
  let cornerSingiel = null;

  if (mode === "corners" || mode === "mixed") {
    const effectiveCc = willHaveSingiel ? cc - 1 : cc;
    const cornerModeA = effectiveCc <= 3;
    cornerPairs = generatePairsForType("corners", effectiveCc, cornerModeA);

    if (willHaveSingiel) {
      const usedPieces = new Set();
      cornerPairs.forEach(([a, b]) => {
        for (const g of CORNERS) {
          if (g.includes(a)) usedPieces.add(g.join(""));
          if (g.includes(b)) usedPieces.add(g.join(""));
        }
      });
      if (!cornerModeA) {
        const lastLetter = cornerPairs.length > 0 ? cornerPairs[cornerPairs.length - 1][1] : null;
        const candidates = CORNERS
          .filter((g) => usedPieces.has(g.join("")))
          .flatMap((g) => g)
          .filter((l) => l !== lastLetter);
        if (candidates.length > 0) {
          cornerSingiel = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          cornerPairs = generatePairsForType("corners", cc, cornerModeA);
        }
      } else {
        const unusedPieces = CORNERS.filter((g) => !usedPieces.has(g.join("")));
        if (unusedPieces.length > 0) {
          const piece = unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
          cornerSingiel = piece[Math.floor(Math.random() * piece.length)];
        } else {
          cornerPairs = generatePairsForType("corners", cc, cornerModeA);
        }
      }
    }
  }

  const edgePairs =
    mode === "edges" || mode === "mixed"
      ? generatePairsForType("edges", ec, edgeModeA)
      : [];

  const cornerItems = [
    ...cornerPairs.map((p) => ({ pair: p, type: "corner" })),
    ...(cornerSingiel ? [{ pair: [cornerSingiel], type: "corner-single" }] : []),
  ];

  return {
    displayPairs: [
      ...cornerItems,
      ...edgePairs.map((p) => ({ pair: p, type: "edge" })),
    ],
    answerPairs: [
      ...edgePairs.map((p) => ({ pair: p, type: "edge" })),
      ...cornerItems,
    ],
  };
}
