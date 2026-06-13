const ls =
  typeof localStorage !== "undefined"
    ? localStorage
    : { getItem: () => null, setItem: () => {} };

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
    if (g.some((l) => !/^[A-ZŁ]$/.test(l)))
      return `Uzupełnij wszystkie litery w grupie rogów ${i + 1}`;
    if (new Set(g).size !== g.length)
      return `Powtórzona litera w grupie rogów ${i + 1}`;
  }
  for (let i = 0; i < edges.length; i++) {
    const g = edges[i];
    if (g.some((l) => !/^[A-ZŁ]$/.test(l)))
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

export function setCorners(c) {
  CORNERS = c;
}
export function setEdges(e) {
  EDGES = e;
}

export const CORNER_WEIGHTS = [
  { value: 2, weight: 5 },
  { value: 3, weight: 30 },
  { value: 4, weight: 47 },
  { value: 5, weight: 18 },
];
export const EDGE_WEIGHTS = [
  { value: 4, weight: 6 },
  { value: 5, weight: 35 },
  { value: 6, weight: 42 },
  { value: 7, weight: 15 },
];

// 4BLD: 23 litery (A-Z bez J + Ł), każda jako osobny kawałek
export const DEFAULT_WINGS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "W",
  "X",
  "Z",
  "Ł",
];
export const DEFAULT_CENTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "W",
  "X",
  "Z",
  "Ł",
];

// 4BLD rogi — domyślnie takie same jak 3x3
export const DEFAULT_CORNERS_4BLD = [
  ["A", "O", "L"],
  ["B", "H", "K"],
  ["C", "G", "D"],
  ["N", "I", "T"],
  ["S", "E", "J"],
  ["M", "R", "U"],
  ["W", "P", "F"],
];

function loadSchema4BLD() {
  try {
    const raw = ls.getItem("bld-schema-4bld");
    if (!raw)
      return {
        corners: DEFAULT_CORNERS_4BLD,
        wings: DEFAULT_WINGS,
        centers: DEFAULT_CENTERS,
      };
    const s = JSON.parse(raw);
    return {
      corners: Array.isArray(s.corners) ? s.corners : DEFAULT_CORNERS_4BLD,
      wings: Array.isArray(s.wings) ? s.wings : DEFAULT_WINGS,
      centers: Array.isArray(s.centers) ? s.centers : DEFAULT_CENTERS,
    };
  } catch {
    return {
      corners: DEFAULT_CORNERS_4BLD,
      wings: DEFAULT_WINGS,
      centers: DEFAULT_CENTERS,
    };
  }
}

export function saveSchema4BLD(corners, wings, centers) {
  ls.setItem("bld-schema-4bld", JSON.stringify({ corners, wings, centers }));
}

export function validateSchema4BLD(corners, wings, centers) {
  if (corners.length === 0) return "Schemat rogów nie może być pusty";
  for (let i = 0; i < corners.length; i++) {
    const g = corners[i];
    if (g.some((l) => !/^[A-ZŁ]$/.test(l)))
      return `Uzupełnij wszystkie litery w grupie rogów ${i + 1}`;
    if (new Set(g).size !== g.length)
      return `Powtórzona litera w grupie rogów ${i + 1}`;
  }
  const cLetters = corners.flat();
  if (new Set(cLetters).size !== cLetters.length)
    return "Powtórzona litera w schemacie rogów";

  const wLetters = wings.flat().filter((l) => l);
  if (wLetters.length !== 23)
    return `Uzupełnij wszystkie 23 litery wingsów (masz ${wLetters.length})`;
  if (wLetters.some((l) => !/^[A-ZŁ]$/.test(l)))
    return "Litery wingsów muszą być A-Z lub Ł";
  if (new Set(wLetters).size !== wLetters.length)
    return "Powtórzona litera w wingsach";

  const ctLetters = centers.flat().filter((l) => l);
  if (ctLetters.length !== 23)
    return `Uzupełnij wszystkie 23 litery centrów (masz ${ctLetters.length})`;
  if (ctLetters.some((l) => !/^[A-ZŁ]$/.test(l)))
    return "Litery centrów muszą być A-Z lub Ł";
  if (new Set(ctLetters).size !== ctLetters.length)
    return "Powtórzona litera w centrach";

  return null;
}

const _schema4BLD = loadSchema4BLD();
export let CORNERS_4BLD = _schema4BLD.corners;
export let WINGS = _schema4BLD.wings.map((l) => [l]);
export let CENTERS = _schema4BLD.centers.map((l) => [l]);

export function setCorners4BLD(c) {
  CORNERS_4BLD = c;
}
export function setWings(w) {
  WINGS = w.map((l) => [l]);
}
export function setCenters(c) {
  CENTERS = c.map((l) => [l]);
}

// Wagi dla 4BLD wingsów: 50/50 (11+1 vs 12 par)
export const WINGS_WEIGHTS = [
  { value: 11, weight: 50 },
  { value: 12, weight: 50 },
];

// Wagi dla 4BLD center: równe 20% każdy
export const CENTERS_WEIGHTS = [
  { value: 6, weight: 20 },
  { value: 7, weight: 20 },
  { value: 8, weight: 20 },
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

export function getBlockedLetters(pair, schema) {
  const blocked = new Set(pair);
  for (const letter of pair) {
    for (const group of schema) {
      if (group.includes(letter)) group.forEach((l) => blocked.add(l));
    }
  }
  return blocked;
}
