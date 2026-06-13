import {
  CORNERS, EDGES, WINGS, CENTERS, CORNERS_4BLD,
  CORNER_WEIGHTS, EDGE_WEIGHTS, WINGS_WEIGHTS, CENTERS_WEIGHTS,
  weightedRandom, shuffle, getBlockedLetters
} from "./schema.js";

function _tryGen5CornerPairs(schema) {
  const pairs = [];
  const pieceUses = new Map(schema.map(g => [g.join(""), 0]));
  const loopBlocked = new Set();
  const usedPairs = new Set();

  const getPiece = letter => schema.find(g => g.includes(letter));
  const getPieceKey = letter => getPiece(letter)?.join("");

  const getAvailableLetters = (excludePieceKey = null) => {
    const letters = [];
    for (const group of schema) {
      const key = group.join("");
      if (pieceUses.get(key) >= 2) continue;
      if (key === excludePieceKey) continue;
      for (const letter of group) {
        if (loopBlocked.has(letter)) continue;
        letters.push({ letter, pieceKey: key, isRepeat: pieceUses.get(key) === 1 });
      }
    }
    return letters;
  };

  const makePair = (firstMustRepeat, secondMustRepeat, prevPieceKey) => {
    let availFirst = getAvailableLetters(prevPieceKey);
    if (firstMustRepeat) availFirst = availFirst.filter(x => x.isRepeat);
    else if (firstMustRepeat === false) availFirst = availFirst.filter(x => !x.isRepeat);

    availFirst = shuffle(availFirst);

    for (const first of availFirst) {
      let availSecond = getAvailableLetters(first.pieceKey);
      if (secondMustRepeat) availSecond = availSecond.filter(x => x.isRepeat);
      else if (secondMustRepeat === false) availSecond = availSecond.filter(x => !x.isRepeat);

      // Nie można mieć dwóch zamknięć w jednej parze
      if (first.isRepeat) availSecond = availSecond.filter(x => !x.isRepeat);

      // Sprawdź duplikaty par
      availSecond = availSecond.filter(x => {
        const pk = [first.letter, x.letter].sort().join("-");
        return !usedPairs.has(pk);
      });

      if (availSecond.length === 0) continue;

      const second = availSecond[Math.floor(Math.random() * availSecond.length)];

      // Blokada pętli - zamknięcie blokuje kawałki otwarte PRZED tą parą
      const firstWillClose = pieceUses.get(first.pieceKey) === 1;
      const secondWillClose = pieceUses.get(second.pieceKey) === 1;

      if (firstWillClose) {
        for (const [key, uses] of pieceUses) {
          if (uses === 1 && key !== first.pieceKey && key !== second.pieceKey) {
            schema.find(g => g.join("") === key)?.forEach(l => loopBlocked.add(l));
          }
        }
      }

      // Aktualizuj stan
      pairs.push([first.letter, second.letter]);
      usedPairs.add([first.letter, second.letter].sort().join("-"));

      pieceUses.set(first.pieceKey, pieceUses.get(first.pieceKey) + 1);
      pieceUses.set(second.pieceKey, pieceUses.get(second.pieceKey) + 1);

      // Jeśli drugi się zamyka, blokuj pozostałe otwarte (już po aktualizacji pierwszego)
      if (secondWillClose) {
        for (const [key, uses] of pieceUses) {
          if (uses === 1 && key !== second.pieceKey) {
            schema.find(g => g.join("") === key)?.forEach(l => loopBlocked.add(l));
          }
        }
      }

      return second.pieceKey;
    }
    return null;
  };

  // Struktura 5 par: (nowy+nowy), (zamknięcie+nowy), (nowy+nowy), (zamknięcie+nowy), (nowy+zamknięcie)
  let prevPiece = null;

  // Para 1: nowy + nowy
  prevPiece = makePair(false, false, null);
  if (!prevPiece) return null;

  // Para 2: zamknięcie + nowy (zamknięcie z pary 1)
  prevPiece = makePair(true, false, prevPiece);
  if (!prevPiece) return null;

  // Para 3: nowy + nowy
  prevPiece = makePair(false, false, prevPiece);
  if (!prevPiece) return null;

  // Para 4: zamknięcie + nowy (zamknięcie z pary 3)
  prevPiece = makePair(true, false, prevPiece);
  if (!prevPiece) return null;

  // Para 5: nowy + zamknięcie
  prevPiece = makePair(false, true, prevPiece);
  if (!prevPiece) return null;

  return pairs;
}

function _tryGenPairs(schema, count, config) {
  const { blockingLimit, targetRepeats, skipPiece } = config;
  const pairs = [];
  const pieceState = new Map(schema.map((g, idx) => [g.join(""), { uses: 0, firstUsedAt: -1, index: idx }]));
  const groupBlocked = new Set();
  const loopBlocked = new Set();
  let repeatsUsed = 0;

  if (skipPiece !== undefined && skipPiece >= 0 && skipPiece < schema.length) {
    schema[skipPiece].forEach((l) => groupBlocked.add(l));
  }

  let attempts = 0;
  while (pairs.length < count && attempts < 1000) {
    attempts++;

    const prevSecondLetter = pairs.length > 0 ? pairs[pairs.length - 1][1] : null;
    const prevSecondPiece = prevSecondLetter ? schema.find(g => g.includes(prevSecondLetter))?.join("") : null;
    const isLastPair = pairs.length === count - 1;
    const applyBlock = pairs.length < blockingLimit;
    const lettersNeeded = (count - pairs.length) * 2;
    const repeatsRemaining = targetRepeats - repeatsUsed;

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

    let availFirst = avail.filter((x) => x.pieceKey !== prevSecondPiece);

    availFirst = shuffle(availFirst);
    if (availFirst.length === 0) return null;

    let placed = false;
    for (const first of availFirst) {
      let candidates = avail.filter((x) => {
        if (x.pieceKey === first.pieceKey) return false;
        const pk = [first.letter, x.letter].sort().join("-");
        if (pairs.some(([a, b]) => [a, b].sort().join("-") === pk)) return false;
        if (first.isRepeat && x.isRepeat) return false;
        return true;
      });

      if (targetRepeats >= 1) {
        const maxRepeatsBeforeLastPair = targetRepeats - 1;
        const repeatsAvailableBeforeLastPair = maxRepeatsBeforeLastPair - repeatsUsed;
        const pairsBeforeLastPair = count - pairs.length - 1;
        const maxPossibleRepeats = pairsBeforeLastPair * 2;

        if (isLastPair) {
          if (first.isRepeat) continue;
          candidates = candidates.filter((x) => x.isRepeat);
        } else {
          if (repeatsAvailableBeforeLastPair <= 0) {
            if (first.isRepeat) continue;
            candidates = candidates.filter((x) => !x.isRepeat);
          } else if (repeatsAvailableBeforeLastPair > maxPossibleRepeats) {
            if (!first.isRepeat) {
              candidates = candidates.filter((x) => x.isRepeat);
            }
          } else {
            const willFirstRepeat = first.isRepeat ? 1 : 0;
            const repeatsLeftAfterFirst = repeatsAvailableBeforeLastPair - willFirstRepeat;
            if (repeatsLeftAfterFirst < 0) {
              if (first.isRepeat) continue;
            }
            const maxPossibleAfterFirst = (pairsBeforeLastPair - 1) * 2 + 1;
            if (repeatsLeftAfterFirst > maxPossibleAfterFirst) {
              candidates = candidates.filter((x) => x.isRepeat);
            } else if (repeatsLeftAfterFirst === 0) {
              candidates = candidates.filter((x) => !x.isRepeat);
            }
          }
        }
      }

      if (candidates.length === 0) continue;

      const second = candidates[Math.floor(Math.random() * candidates.length)];
      pairs.push([first.letter, second.letter]);

      const firstPs = pieceState.get(first.pieceKey);
      if (firstPs.uses === 0) firstPs.firstUsedAt = pairs.length;
      firstPs.uses++;
      if (firstPs.uses === 2) repeatsUsed++;

      const secondPs = pieceState.get(second.pieceKey);
      if (secondPs.uses === 0) secondPs.firstUsedAt = pairs.length;
      secondPs.uses++;
      if (secondPs.uses === 2) repeatsUsed++;

      if (targetRepeats >= 1) {
        for (const ps of [firstPs, secondPs]) {
          if (ps.uses === 2) {
            for (const [key, state] of pieceState) {
              if (state.uses === 1) {
                schema.find(g => g.join("") === key)?.forEach(l => loopBlocked.add(l));
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

export function generatePairsForType(type, count, modeA, options = {}) {
  const schema = type === "corners" ? CORNERS : type === "corners4" ? CORNERS_4BLD : EDGES;
  const isCorners = type === "corners" || type === "corners4";
  const isModeA =
    modeA !== undefined ? modeA : (isCorners ? count <= 3 : count <= 5);

  // Specjalny przypadek: 5 par rogów
  if (isCorners && count === 5 && !isModeA) {
    for (let attempt = 0; attempt < 500; attempt++) {
      const result = _tryGen5CornerPairs(schema);
      if (result) return result;
    }
    return [];
  }

  if (isModeA) {
    const config = { blockingLimit: Infinity, targetRepeats: 0 };
    for (let attempt = 0; attempt < 200; attempt++) {
      const result = _tryGenPairs(schema, count, config);
      if (result) return result;
    }
    return [];
  }

  let targetRepeats;
  let blockingLimit;
  if (isCorners) {
    if (count <= 4) {
      targetRepeats = 1;
      blockingLimit = 2;
    } else {
      targetRepeats = 3;
      blockingLimit = 1;
    }
  } else {
    if (count <= 6) {
      targetRepeats = options.edgeVariant === 'B' ? 2 : 1;
    } else {
      targetRepeats = 3;
    }
    blockingLimit = 2;
  }

  const config = {
    blockingLimit,
    targetRepeats,
    skipPiece: options.skipPiece
  };

  for (let attempt = 0; attempt < 500; attempt++) {
    const result = _tryGenPairs(schema, count, config);
    if (result) return result;
  }

  return [];
}

export function generateSession(mode, cornerCount, edgeCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;

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

  let edgePairs = [];
  if (mode === "edges" || mode === "mixed") {
    const edgeModeA = ec <= 5;
    if (ec === 6 && !edgeModeA) {
      const variant = Math.random() < 0.5 ? 'A' : 'B';
      const skipPiece = variant === 'B' ? Math.floor(Math.random() * EDGES.length) : undefined;
      edgePairs = generatePairsForType("edges", ec, false, { edgeVariant: variant, skipPiece });
    } else {
      edgePairs = generatePairsForType("edges", ec, edgeModeA);
    }
  }

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

// 4BLD: generowanie par dla wingsów (23 litery, każda osobny kawałek)
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

// 4BLD: generowanie par dla center (23 litery, bez powtórek)
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

// 4BLD: generowanie par dla wingsów z 1 powtórką (12 par)
function generateWingsPairsWithRepeat() {
  const letters = WINGS.map(g => g[0]);
  const shuffled = shuffle(letters);

  // Użyjemy 23 liter + 1 powtórka = 24 pozycji = 12 par
  // Wybierz losową literę do powtórzenia
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

  // Centry: losujemy liczbę par, potem 50/50 czy singiel (dla 6 i 7)
  let centersBaseCount;
  if (centersCount === "?") {
    centersBaseCount = weightedRandom(CENTERS_WEIGHTS);
  } else {
    centersBaseCount = centersCount;
  }

  // Rogi 4BLD - używa CORNERS_4BLD
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

  // Wingsy 4BLD: 11+1 (singiel) lub 12 par (1 powtórka)
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

  // Centry 4BLD: 6-8 par, singiel dla 6 i 7
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

  // Kolejność wyświetlania: rogi → wingsy → centry
  // Kolejność odpowiadania: centry → wingsy → rogi
  return {
    displayPairs: [...cornerItems, ...wingsItems, ...centersItems],
    answerPairs: [...centersItems, ...wingsItems, ...cornerItems],
  };
}
