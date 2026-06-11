const ls = typeof localStorage !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {} };

export const DEFAULT_CORNERS = [
  ["A", "O", "L"],
  ["B", "H", "K"],
  ["C", "G", "D"],
  ["N", "I", "T"],
  ["S", "E", "J"],
  ["M", "R", "U"],
  ["W", "P", "F"],
];
export const DEFAULT_EDGES = [
  ["A", "E"],
  ["B", "P"],
  ["C", "L"],
  ["D", "R"],
  ["H", "F"],
  ["G", "T"],
  ["K", "I"],
  ["M", "O"],
  ["N", "W"],
  ["Z", "S"],
  ["U", "J"],
];

function loadSchema() {
  try {
    const raw = ls.getItem("bld-schema");
    if (!raw) return { corners: DEFAULT_CORNERS, edges: DEFAULT_EDGES };
    const s = JSON.parse(raw);
    if (!Array.isArray(s.corners) || !Array.isArray(s.edges))
      return { corners: DEFAULT_CORNERS, edges: DEFAULT_EDGES };
    return s;
  } catch {
    return { corners: DEFAULT_CORNERS, edges: DEFAULT_EDGES };
  }
}

export function saveSchema(corners, edges) {
  ls.setItem("bld-schema", JSON.stringify({ corners, edges }));
}

export function validateSchema(corners, edges) {
  if (corners.length === 0) return "Schemat rogów nie może być pusty";
  if (edges.length === 0) return "Schemat krawędzi nie może być pusty";
  for (let i = 0; i < corners.length; i++) {
    const g = corners[i];
    if (g.some((l) => !/^[A-Z]$/.test(l)))
      return `Uzupełnij wszystkie litery w grupie rogów ${i + 1}`;
    if (new Set(g).size !== g.length)
      return `Powtórzona litera w grupie rogów ${i + 1}`;
  }
  for (let i = 0; i < edges.length; i++) {
    const g = edges[i];
    if (g.some((l) => !/^[A-Z]$/.test(l)))
      return `Uzupełnij wszystkie litery w grupie krawędzi ${i + 1}`;
    if (new Set(g).size !== g.length)
      return `Powtórzona litera w grupie krawędzi ${i + 1}`;
  }
  const cLetters = corners.flat();
  if (new Set(cLetters).size !== cLetters.length)
    return "Powtórzona litera w schemacie rogów";
  const eLetters = edges.flat();
  if (new Set(eLetters).size !== eLetters.length)
    return "Powtórzona litera w schemacie krawędzi";
  return null;
}

const _schema = loadSchema();
export let CORNERS = _schema.corners;
export let EDGES = _schema.edges;

export function setCorners(c) { CORNERS = c; }
export function setEdges(e) { EDGES = e; }

export const CORNER_WEIGHTS = [
  { value: 2, weight: 5 },
  { value: 3, weight: 15 },
  { value: 4, weight: 47 },
  { value: 5, weight: 31 },
];
export const EDGE_WEIGHTS = [
  { value: 4, weight: 6 },
  { value: 5, weight: 35 },
  { value: 6, weight: 42 },
  { value: 7, weight: 15 },
];

export function weightedRandom(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.value;
  }
  return options[options.length - 1].value;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// blocks only letters from the matching schema, not both corners and edges
export function getBlockedLetters(pair, schema) {
  const blocked = new Set(pair);
  for (const letter of pair) {
    for (const group of schema) {
      if (group.includes(letter)) group.forEach((l) => blocked.add(l));
    }
  }
  return blocked;
}

function _tryGenPairs(schema, count, blockingLimit, applyCycleClosure, isCorners) {
  const pairs = [];
  const pieceState = new Map(schema.map((g) => [g.join(""), { uses: 0, firstUsedAt: -1 }]));
  const blocked = new Set();

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
        if (applyBlock && blocked.has(letter)) continue;
        avail.push({ letter, pieceKey: key, isRepeat: ps.uses >= 1, firstUsedAt: ps.firstUsedAt });
      }
    }

    // zasada kolejności: 1. litera pary N+1 ≠ 2. litera pary N
    let availFirst = avail.filter((x) => x.letter !== prevSecondLetter);

    // Tryb B rogi para 3+: 1. litera = włamanie (z kawałka już użytego)
    // Tryb B rogi ostatnia para: 1. litera = nowy kawałek
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

      // Tryb B rogi para 3+: 2. litera = nowy kawałek (nie włamanie)
      // Tryb B rogi ostatnia para: 2. litera = zamknięcie z kawałka który pojawił się w parach 3+ (nie z par 1-2)
      if (isCorners && applyCycleClosure && isPair3Plus) {
        if (isLastPair) {
          candidates = candidates.filter((x) => x.isRepeat && x.firstUsedAt >= 3);
        } else {
          candidates = candidates.filter((x) => !x.isRepeat);
        }
      } else if (applyCycleClosure && isLastPair) {
        // krawędzie Tryb B: 2. litera ostatniej pary musi być włamaniem
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

      if (applyBlock) {
        getBlockedLetters([first.letter, second.letter], schema).forEach((l) =>
          blocked.add(l)
        );
      }
      placed = true;
      break;
    }
    if (!placed) return null;
  }

  return pairs.length === count ? pairs : null;
}

// modeA: true = Tryb A (blokada grupowa wszystkich par, bez zamknięcia cyklu)
//        false = Tryb B (blokada tylko par 1–2, zamknięcie cyklu na ostatniej parze)
// modeA pominięty → wyznaczany automatycznie z count
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
    // Tryb A gdy effectiveCc <= 3 (w tym 3+1: pary blokowane grupowo, singiel z wolnego kawałka)
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
        // zamknięcie cyklu singla: singiel z kawałka już użytego, ≠ ostatnia litera ostatniej pary
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
          // brak wolnego kawałka — wygeneruj pełny zestaw bez singla
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
