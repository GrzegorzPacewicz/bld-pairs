import {
  CORNERS, EDGES, CORNERS_4BLD,
  shuffle, getBlockedLetters
} from "./schema.js";

function _tryGen5CornerPairs(schema) {
  const pairs = [];
  const pieceUses = new Map(schema.map(g => [g.join(""), 0]));
  const loopBlocked = new Set();
  const usedPairs = new Set();

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

      if (first.isRepeat) availSecond = availSecond.filter(x => !x.isRepeat);

      availSecond = availSecond.filter(x => {
        const pk = [first.letter, x.letter].sort().join("-");
        return !usedPairs.has(pk);
      });

      if (availSecond.length === 0) continue;

      const second = availSecond[Math.floor(Math.random() * availSecond.length)];

      const firstWillClose = pieceUses.get(first.pieceKey) === 1;
      const secondWillClose = pieceUses.get(second.pieceKey) === 1;

      if (firstWillClose) {
        for (const [key, uses] of pieceUses) {
          if (uses === 1 && key !== first.pieceKey && key !== second.pieceKey) {
            schema.find(g => g.join("") === key)?.forEach(l => loopBlocked.add(l));
          }
        }
      }

      pairs.push([first.letter, second.letter]);
      usedPairs.add([first.letter, second.letter].sort().join("-"));

      pieceUses.set(first.pieceKey, pieceUses.get(first.pieceKey) + 1);
      pieceUses.set(second.pieceKey, pieceUses.get(second.pieceKey) + 1);

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

  let prevPiece = null;

  prevPiece = makePair(false, false, null);
  if (!prevPiece) return null;

  prevPiece = makePair(true, false, prevPiece);
  if (!prevPiece) return null;

  prevPiece = makePair(false, false, prevPiece);
  if (!prevPiece) return null;

  prevPiece = makePair(true, false, prevPiece);
  if (!prevPiece) return null;

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
