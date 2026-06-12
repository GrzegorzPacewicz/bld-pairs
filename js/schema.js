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

export function getBlockedLetters(pair, schema) {
  const blocked = new Set(pair);
  for (const letter of pair) {
    for (const group of schema) {
      if (group.includes(letter)) group.forEach((l) => blocked.add(l));
    }
  }
  return blocked;
}
