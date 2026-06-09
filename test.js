// node test.js
const assert = require("assert");

// ─── SCHEMA (copy from app.js) ────────────────────────────────────────────────
const CORNERS = [
  ["A", "O", "L"],
  ["B", "H", "K"],
  ["C", "G", "D"],
  ["N", "I", "T"],
  ["S", "E", "J"],
  ["M", "R", "U"],
  ["W", "P", "F"],
];
const EDGES = [
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

const CORNER_WEIGHTS = [
  { value: 3, weight: 45 },
  { value: 4, weight: 45 },
  { value: 5, weight: 10 },
];
const EDGE_WEIGHTS = [
  { value: 4, weight: 50 },
  { value: 6, weight: 50 },
];

function weightedRandom(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.weight;
    if (r <= 0) return o.value;
  }
  return options[options.length - 1].value;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePairsForType(type, count) {
  const schema = type === "corners" ? CORNERS : EDGES;
  const pairs = [];
  const pieceUses = new Map(schema.map((g) => [g.join(""), 0]));
  const getAvailable = () => {
    const out = [];
    for (const group of schema) {
      const key = group.join("");
      if (pieceUses.get(key) < 2)
        group.forEach((l) => out.push({ letter: l, pieceKey: key }));
    }
    return out;
  };
  let attempts = 0;
  while (pairs.length < count && attempts < 1000) {
    attempts++;
    const avail = shuffle(getAvailable());
    if (avail.length < 2) break;
    const lastLetter = pairs.length > 0 ? pairs[pairs.length - 1][1] : null;
    const first = lastLetter ? avail.find((x) => x.letter !== lastLetter) : avail[0];
    if (!first) continue;
    const second = avail.find((x) => x.pieceKey !== first.pieceKey);
    if (!second) break;
    const pairKey = [first.letter, second.letter].sort().join("-");
    if (pairs.some(([a, b]) => [a, b].sort().join("-") === pairKey)) continue;
    pairs.push([first.letter, second.letter]);
    pieceUses.set(first.pieceKey, pieceUses.get(first.pieceKey) + 1);
    pieceUses.set(second.pieceKey, pieceUses.get(second.pieceKey) + 1);
  }
  return pairs;
}

function generateSession(mode, cornerCount, edgeCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;
  const cornerPairs =
    mode === "corners" || mode === "mixed"
      ? generatePairsForType("corners", cc)
      : [];
  const edgePairs =
    mode === "edges" || mode === "mixed"
      ? generatePairsForType("edges", ec)
      : [];
  return {
    displayPairs: [
      ...cornerPairs.map((p) => ({ pair: p, type: "corner" })),
      ...edgePairs.map((p) => ({ pair: p, type: "edge" })),
    ],
    answerPairs: [
      ...edgePairs.map((p) => ({ pair: p, type: "edge" })),
      ...cornerPairs.map((p) => ({ pair: p, type: "corner" })),
    ],
  };
}

function fmt(s) {
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
}

// ─── TEST RUNNER ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗  ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

// ─── fmt ──────────────────────────────────────────────────────────────────────
console.log("\nfmt");
test("0s → 00:00",  () => assert.strictEqual(fmt(0), "00:00"));
test("65s → 01:05", () => assert.strictEqual(fmt(65), "01:05"));
test("3599s → 59:59", () => assert.strictEqual(fmt(3599), "59:59"));
test("3600s → 60:00", () => assert.strictEqual(fmt(3600), "60:00"));

// ─── weightedRandom ───────────────────────────────────────────────────────────
console.log("\nweightedRandom");
const validCornerValues = new Set(CORNER_WEIGHTS.map((o) => o.value));
const validEdgeValues   = new Set(EDGE_WEIGHTS.map((o) => o.value));

test("always returns a value from CORNER_WEIGHTS", () => {
  for (let i = 0; i < 200; i++)
    assert.ok(validCornerValues.has(weightedRandom(CORNER_WEIGHTS)));
});
test("always returns a value from EDGE_WEIGHTS", () => {
  for (let i = 0; i < 200; i++)
    assert.ok(validEdgeValues.has(weightedRandom(EDGE_WEIGHTS)));
});

// ─── shuffle ──────────────────────────────────────────────────────────────────
console.log("\nshuffle");
test("returns a copy, not the same reference", () => {
  const arr = [1, 2, 3];
  assert.notStrictEqual(shuffle(arr), arr);
});
test("preserves all elements", () => {
  const arr = [1, 2, 3, 4, 5];
  assert.deepStrictEqual([...shuffle(arr)].sort((a, b) => a - b), arr);
});
test("preserves length", () => {
  const arr = ["A", "B", "C"];
  assert.strictEqual(shuffle(arr).length, arr.length);
});
test("does not mutate the original array", () => {
  const arr = [1, 2, 3];
  shuffle(arr);
  assert.deepStrictEqual(arr, [1, 2, 3]);
});

// ─── generatePairsForType — corners ──────────────────────────────────────────
console.log("\ngeneratePairsForType (corners)");
const allCornerLetters = new Set(CORNERS.flat());
const cornerPieceOf    = Object.fromEntries(
  CORNERS.flatMap((g) => g.map((l) => [l, g.join("")]))
);

test("returns requested count", () => {
  for (const n of [3, 4, 5]) {
    const pairs = generatePairsForType("corners", n);
    assert.strictEqual(pairs.length, n, `expected ${n} pairs, got ${pairs.length}`);
  }
});
test("each pair has 2 elements", () => {
  generatePairsForType("corners", 5).forEach((p) =>
    assert.strictEqual(p.length, 2)
  );
});
test("both letters in a pair are valid corner letters", () => {
  generatePairsForType("corners", 5).forEach(([a, b]) => {
    assert.ok(allCornerLetters.has(a), `unknown letter ${a}`);
    assert.ok(allCornerLetters.has(b), `unknown letter ${b}`);
  });
});
test("no pair uses two letters from the same corner piece", () => {
  for (let i = 0; i < 20; i++) {
    generatePairsForType("corners", 5).forEach(([a, b]) =>
      assert.notStrictEqual(cornerPieceOf[a], cornerPieceOf[b],
        `same piece in pair: ${a}-${b}`)
    );
  }
});
test("no corner piece used more than twice across a session", () => {
  for (let i = 0; i < 20; i++) {
    const uses = new Map(CORNERS.map((g) => [g.join(""), 0]));
    generatePairsForType("corners", 5).forEach(([a, b]) => {
      uses.set(cornerPieceOf[a], uses.get(cornerPieceOf[a]) + 1);
      uses.set(cornerPieceOf[b], uses.get(cornerPieceOf[b]) + 1);
    });
    uses.forEach((count, key) =>
      assert.ok(count <= 2, `piece ${key} used ${count} times`)
    );
  }
});

// ─── generatePairsForType — edges ─────────────────────────────────────────────
console.log("\ngeneratePairsForType (edges)");
const allEdgeLetters = new Set(EDGES.flat());
const edgePieceOf    = Object.fromEntries(
  EDGES.flatMap((g) => g.map((l) => [l, g.join("")]))
);

test("returns requested count", () => {
  for (const n of [4, 5, 6, 7]) {
    const pairs = generatePairsForType("edges", n);
    assert.strictEqual(pairs.length, n, `expected ${n} pairs, got ${pairs.length}`);
  }
});
test("both letters in a pair are valid edge letters", () => {
  generatePairsForType("edges", 7).forEach(([a, b]) => {
    assert.ok(allEdgeLetters.has(a), `unknown letter ${a}`);
    assert.ok(allEdgeLetters.has(b), `unknown letter ${b}`);
  });
});
test("no pair uses two letters from the same edge piece", () => {
  for (let i = 0; i < 20; i++) {
    generatePairsForType("edges", 7).forEach(([a, b]) =>
      assert.notStrictEqual(edgePieceOf[a], edgePieceOf[b],
        `same piece in pair: ${a}-${b}`)
    );
  }
});
test("no edge piece used more than twice", () => {
  for (let i = 0; i < 20; i++) {
    const uses = new Map(EDGES.map((g) => [g.join(""), 0]));
    generatePairsForType("edges", 7).forEach(([a, b]) => {
      uses.set(edgePieceOf[a], uses.get(edgePieceOf[a]) + 1);
      uses.set(edgePieceOf[b], uses.get(edgePieceOf[b]) + 1);
    });
    uses.forEach((count, key) =>
      assert.ok(count <= 2, `piece ${key} used ${count} times`)
    );
  }
});

// ─── generateSession ──────────────────────────────────────────────────────────
console.log("\ngenerateSession");
test("mode=corners: only corner pairs, no edge pairs", () => {
  const s = generateSession("corners", 4, 5);
  assert.ok(s.displayPairs.every((p) => p.type === "corner"));
  assert.ok(s.answerPairs.every((p) => p.type === "corner"));
});
test("mode=edges: only edge pairs, no corner pairs", () => {
  const s = generateSession("edges", 4, 5);
  assert.ok(s.displayPairs.every((p) => p.type === "edge"));
  assert.ok(s.answerPairs.every((p) => p.type === "edge"));
});
test("mode=mixed: contains both types", () => {
  const s = generateSession("mixed", 4, 5);
  assert.ok(s.displayPairs.some((p) => p.type === "corner"));
  assert.ok(s.displayPairs.some((p) => p.type === "edge"));
});
test("displayPairs: corners first, then edges", () => {
  const s = generateSession("mixed", 4, 5);
  const types = s.displayPairs.map((p) => p.type);
  const firstEdge = types.indexOf("edge");
  const lastCorner = types.lastIndexOf("corner");
  assert.ok(firstEdge === -1 || lastCorner < firstEdge,
    "corners must come before edges in displayPairs");
});
test("answerPairs: edges first, then corners", () => {
  const s = generateSession("mixed", 4, 5);
  const types = s.answerPairs.map((p) => p.type);
  const firstCorner = types.indexOf("corner");
  const lastEdge = types.lastIndexOf("edge");
  assert.ok(firstCorner === -1 || lastEdge < firstCorner,
    "edges must come before corners in answerPairs");
});
test("displayPairs and answerPairs contain the same pairs (unordered)", () => {
  const s = generateSession("mixed", 4, 5);
  const key = ({ pair, type }) => `${type}:${[...pair].sort().join("-")}`;
  const d = s.displayPairs.map(key).sort();
  const a = s.answerPairs.map(key).sort();
  assert.deepStrictEqual(d, a);
});
test("mode=corners with ?-count returns 3, 4, or 5 pairs", () => {
  for (let i = 0; i < 30; i++) {
    const s = generateSession("corners", "?", 0);
    assert.ok([3, 4, 5].includes(s.displayPairs.length),
      `unexpected count: ${s.displayPairs.length}`);
  }
});
test("mode=edges with ?-count returns 4 or 6 pairs", () => {
  for (let i = 0; i < 30; i++) {
    const s = generateSession("edges", 0, "?");
    assert.ok([4, 6].includes(s.displayPairs.length),
      `unexpected count: ${s.displayPairs.length}`);
  }
});

// ─── blokowanie kawałków ──────────────────────────────────────────────────────
console.log("\nblokowanie kawałków");
test("kawałek użyty 2x nie pojawia się w kolejnych parach (corners)", () => {
  for (let i = 0; i < 20; i++) {
    const pairs = generatePairsForType("corners", 5);
    const uses = new Map(CORNERS.map((g) => [g.join(""), 0]));
    pairs.forEach(([a, b]) => {
      const ka = cornerPieceOf[a];
      const kb = cornerPieceOf[b];
      assert.ok(uses.get(ka) < 2, `litera ${a} z kawałka ${ka} użytego już 2x`);
      assert.ok(uses.get(kb) < 2, `litera ${b} z kawałka ${kb} użytego już 2x`);
      uses.set(ka, uses.get(ka) + 1);
      uses.set(kb, uses.get(kb) + 1);
    });
  }
});

// ─── zasada kolejności ────────────────────────────────────────────────────────
console.log("\nzasada kolejności");
test("druga litera pary N ≠ pierwsza litera pary N+1 (corners)", () => {
  for (let i = 0; i < 20; i++) {
    const pairs = generatePairsForType("corners", 5);
    for (let j = 0; j < pairs.length - 1; j++)
      assert.notStrictEqual(pairs[j][1], pairs[j + 1][0],
        `para ${j}: [${pairs[j]}] → para ${j+1}: [${pairs[j+1]}] — kolizja`);
  }
});
test("druga litera pary N ≠ pierwsza litera pary N+1 (edges)", () => {
  for (let i = 0; i < 20; i++) {
    const pairs = generatePairsForType("edges", 7);
    for (let j = 0; j < pairs.length - 1; j++)
      assert.notStrictEqual(pairs[j][1], pairs[j + 1][0],
        `para ${j}: [${pairs[j]}] → para ${j+1}: [${pairs[j+1]}] — kolizja`);
  }
});

// ─── powtórzona para ──────────────────────────────────────────────────────────
console.log("\npowtórzona para");
test("brak duplikatów par (corners)", () => {
  for (let i = 0; i < 20; i++) {
    const pairs = generatePairsForType("corners", 5);
    const seen = new Set();
    pairs.forEach(([a, b]) => {
      const key = [a, b].sort().join("-");
      assert.ok(!seen.has(key), `para ${a}-${b} pojawia się dwa razy`);
      seen.add(key);
    });
  }
});
test("brak duplikatów par (edges)", () => {
  for (let i = 0; i < 20; i++) {
    const pairs = generatePairsForType("edges", 7);
    const seen = new Set();
    pairs.forEach(([a, b]) => {
      const key = [a, b].sort().join("-");
      assert.ok(!seen.has(key), `para ${a}-${b} pojawia się dwa razy`);
      seen.add(key);
    });
  }
});

// ─── parzystość krawędzi ──────────────────────────────────────────────────────
console.log("\nparzystość krawędzi");
test("liczba par krawędzi jest zawsze parzysta (tryb edges, ?)", () => {
  for (let i = 0; i < 30; i++) {
    const s = generateSession("edges", 0, "?");
    assert.strictEqual(s.displayPairs.length % 2, 0,
      `nieparzysta liczba par: ${s.displayPairs.length}`);
  }
});
test("liczba par krawędzi jest zawsze parzysta (tryb mixed, ?)", () => {
  for (let i = 0; i < 30; i++) {
    const s = generateSession("mixed", 4, "?");
    const ec = s.displayPairs.filter((p) => p.type === "edge").length;
    assert.strictEqual(ec % 2, 0, `nieparzysta liczba par krawędzi: ${ec}`);
  }
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
