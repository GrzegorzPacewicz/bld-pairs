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
  { value: 3, weight: 44 },
  { value: 4, weight: 46 },
  { value: 5, weight: 5 },
];
export const EDGE_WEIGHTS = [
  { value: 4, weight: 20 },
  { value: 5, weight: 40 },
  { value: 6, weight: 35 },
  { value: 7, weight: 5 },
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

export function generatePairsForType(type, count, blockingLimit = 0) {
  const schema = type === "corners" ? CORNERS : EDGES;
  const pairs = [];
  const pieceState = new Map(schema.map((g) => [g.join(""), { uses: 0 }]));
  let blocked = new Set();

  const getAvailable = () => {
    const useBlocked = pairs.length < blockingLimit;
    const out = [];
    for (const group of schema) {
      const key = group.join("");
      const ps = pieceState.get(key);
      if (ps.uses === 0 || ps.uses === 1) {
        group.forEach((l) => {
          if (!useBlocked || !blocked.has(l)) out.push({ letter: l, pieceKey: key });
        });
      }
    }
    return out;
  };

  let attempts = 0;
  while (pairs.length < count && attempts < 1000) {
    attempts++;
    const avail = shuffle(getAvailable());
    if (avail.length < 2) break;
    const first = avail[0];
    const second = avail.find((x) => x.pieceKey !== first.pieceKey);
    if (!second) break;
    const pairKey = [first.letter, second.letter].sort().join("-");
    if (pairs.some(([a, b]) => [a, b].sort().join("-") === pairKey)) continue;
    pairs.push([first.letter, second.letter]);
    [first, second].forEach(({ pieceKey }) => {
      pieceState.get(pieceKey).uses++;
    });
    if (pairs.length <= blockingLimit) {
      const newBlocked = getBlockedLetters([first.letter, second.letter], schema);
      newBlocked.forEach((l) => blocked.add(l));
    }
  }
  return pairs;
}

export function generateSession(mode, cornerCount, edgeCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;
  const cornerPairs =
    mode === "corners" || mode === "mixed"
      ? generatePairsForType("corners", cc, 3)
      : [];

  let cornerSingiel = null;
  if (
    (mode === "corners" || mode === "mixed") &&
    (cornerCount === "?" || cornerCount <= 4) &&
    cc !== 5 &&
    Math.random() < 0.5
  ) {
    const usedLetters = new Set(cornerPairs.flat());
    let candidatePieces;
    if (cc <= 2) {
      candidatePieces = CORNERS.filter((g) => g.every((l) => !usedLetters.has(l)));
    } else {
      const pieceUses = new Map();
      cornerPairs.forEach(([a, b]) => {
        for (const g of CORNERS) {
          if (g.includes(a)) pieceUses.set(g.join(""), (pieceUses.get(g.join("")) || 0) + 1);
          if (g.includes(b)) pieceUses.set(g.join(""), (pieceUses.get(g.join("")) || 0) + 1);
        }
      });
      candidatePieces = CORNERS.filter((g) => (pieceUses.get(g.join("")) || 0) < 2);
    }
    if (candidatePieces.length > 0) {
      const piece = candidatePieces[Math.floor(Math.random() * candidatePieces.length)];
      cornerSingiel = piece[Math.floor(Math.random() * piece.length)];
    }
  }

  const edgePairs =
    mode === "edges" || mode === "mixed"
      ? generatePairsForType("edges", ec, 5)
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
