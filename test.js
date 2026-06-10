// node --experimental-vm-modules test.js  OR  node test.js (Node 22+)
import assert from "node:assert";
import {
  CORNERS, EDGES,
  CORNER_WEIGHTS, EDGE_WEIGHTS,
  weightedRandom, shuffle, getBlockedLetters,
  generatePairsForType, generateSession,
} from "./js/schema.js";
import { formatTime } from "./js/timer.js";

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

// ─── formatTime ──────────────────────────────────────────────────────────────────────
console.log("\nformatTime");
test("0s → 00:00",  () => assert.strictEqual(formatTime(0), "00:00"));
test("65s → 01:05", () => assert.strictEqual(formatTime(65), "01:05"));
test("3599s → 59:59", () => assert.strictEqual(formatTime(3599), "59:59"));
test("3600s → 60:00", () => assert.strictEqual(formatTime(3600), "60:00"));

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

// ─── getBlockedLetters ────────────────────────────────────────────────────────
console.log("\ngetBlockedLetters");
const cornerGroupOf = (l) => CORNERS.find((g) => g.includes(l));
const edgeGroupOf   = (l) => EDGES.find((g) => g.includes(l));

test("para [A,B] w CORNERS blokuje grupę AOL i BHK", () => {
  const blocked = getBlockedLetters(["A", "B"], CORNERS);
  ["A", "O", "L", "B", "H", "K"].forEach((l) =>
    assert.ok(blocked.has(l), `oczekiwano blokady litery ${l}`)
  );
});
test("para [A,B] w CORNERS nie blokuje innych grup", () => {
  const blocked = getBlockedLetters(["A", "B"], CORNERS);
  ["C", "G", "D", "N", "I", "T", "S", "E", "J", "M", "R", "U", "W", "P", "F"].forEach((l) =>
    assert.ok(!blocked.has(l), `litera ${l} nie powinna być zablokowana`)
  );
});
test("para [A,B] w EDGES blokuje AE i BP, nie O i L", () => {
  const blocked = getBlockedLetters(["A", "B"], EDGES);
  ["A", "E", "B", "P"].forEach((l) =>
    assert.ok(blocked.has(l), `oczekiwano blokady litery ${l}`)
  );
  ["O", "L", "H", "K"].forEach((l) =>
    assert.ok(!blocked.has(l), `litera ${l} nie powinna być zablokowana (schemat EDGES)`)
  );
});
test("blokada nie miesza schematów: CORNERS nie wpływa na wynik EDGES", () => {
  const blocked = getBlockedLetters(["A"], EDGES);
  assert.ok(blocked.has("E"), "E powinno być zablokowane (EDGES)");
  assert.ok(!blocked.has("O"), "O nie powinno być zablokowane (nie ma go w EDGES)");
  assert.ok(!blocked.has("L"), "L nie powinno być zablokowane (nie ma go w EDGES)");
});
test("para o jednej literze blokuje jej grupę", () => {
  const blocked = getBlockedLetters(["G"], CORNERS);
  assert.ok(blocked.has("C"));
  assert.ok(blocked.has("G"));
  assert.ok(blocked.has("D"));
});

// ─── generatePairsForType — corners ──────────────────────────────────────────
console.log("\ngeneratePairsForType (corners)");
const allCornerLetters = new Set(CORNERS.flat());
const cornerPieceOf    = Object.fromEntries(
  CORNERS.flatMap((g) => g.map((l) => [l, g.join("")]))
);

test("returns requested count (no blocking)", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [3, 4, 5]) {
      const pairs = generatePairsForType("corners", n);
      assert.strictEqual(pairs.length, n, `expected ${n} pairs, got ${pairs.length}`);
    }
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

test("returns requested count (no blocking)", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [4, 5, 6, 7]) {
      const pairs = generatePairsForType("edges", n);
      assert.strictEqual(pairs.length, n, `expected ${n} pairs, got ${pairs.length}`);
    }
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

// ─── reguła blokady liter ─────────────────────────────────────────────────────
console.log("\nreguła blokady liter");

test("Tryb A (corners, count=3): wszystkie pary mają unikalne kawałki", () => {
  for (let i = 0; i < 50; i++) {
    const pairs = generatePairsForType("corners", 3, true);
    for (let j = 0; j < pairs.length; j++) {
      for (let k = j + 1; k < pairs.length; k++) {
        for (const lj of pairs[j]) {
          const group = cornerGroupOf(lj);
          for (const lk of pairs[k]) {
            assert.ok(
              !group.includes(lk),
              `litera ${lk} (para ${k}: [${pairs[k]}]) w grupie litery ${lj} (para ${j}: [${pairs[j]}])`
            );
          }
        }
      }
    }
  }
});
test("Tryb A (edges, count=5): wszystkie pary mają unikalne kawałki", () => {
  for (let i = 0; i < 50; i++) {
    const pairs = generatePairsForType("edges", 5, true);
    for (let j = 0; j < pairs.length; j++) {
      for (let k = j + 1; k < pairs.length; k++) {
        for (const lj of pairs[j]) {
          const group = edgeGroupOf(lj);
          for (const lk of pairs[k]) {
            assert.ok(
              !group.includes(lk),
              `litera ${lk} (para ${k}: [${pairs[k]}]) w grupie litery ${lj} (para ${j}: [${pairs[j]}])`
            );
          }
        }
      }
    }
  }
});
test("Tryb B (corners, count=5): pary 1–2 mają unikalne kawałki", () => {
  for (let i = 0; i < 30; i++) {
    const pairs = generatePairsForType("corners", 5, false);
    assert.strictEqual(pairs.length, 5, `oczekiwano 5 par, got ${pairs.length}`);
    for (let j = 0; j < 2; j++) {
      for (let k = j + 1; k < 2; k++) {
        for (const lj of pairs[j]) {
          for (const lk of pairs[k]) {
            assert.notStrictEqual(cornerPieceOf[lj], cornerPieceOf[lk],
              `pary ${j} i ${k} dzielą grupę: ${lj}-${lk}`);
          }
        }
      }
    }
  }
});
test("Tryb B (edges, count=7): pary 1–2 mają unikalne kawałki", () => {
  for (let i = 0; i < 30; i++) {
    const pairs = generatePairsForType("edges", 7, false);
    assert.strictEqual(pairs.length, 7, `oczekiwano 7 par, got ${pairs.length}`);
    for (let j = 0; j < 2; j++) {
      for (let k = j + 1; k < 2; k++) {
        for (const lj of pairs[j]) {
          for (const lk of pairs[k]) {
            assert.notStrictEqual(edgePieceOf[lj], edgePieceOf[lk],
              `pary ${j} i ${k} dzielą grupę: ${lj}-${lk}`);
          }
        }
      }
    }
  }
});

// ─── blokowanie kawałków ──────────────────────────────────────────────────────
console.log("\nblokowanie kawałków (bez blokady)");
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
test("z kawałka może powtórzyć się dowolna litera, ale max 2 użycia (corners)", () => {
  for (let i = 0; i < 30; i++) {
    const pairs = generatePairsForType("corners", 5);
    const uses = new Map(CORNERS.map((g) => [g.join(""), 0]));
    pairs.forEach(([a, b]) => {
      uses.set(cornerPieceOf[a], uses.get(cornerPieceOf[a]) + 1);
      uses.set(cornerPieceOf[b], uses.get(cornerPieceOf[b]) + 1);
    });
    for (const [key, count] of uses) {
      assert.ok(count <= 2, `klocek ${key} użyty ${count} razy`);
    }
  }
});
test("z kawałka może powtórzyć się dowolna litera, ale max 2 użycia (edges)", () => {
  for (let i = 0; i < 30; i++) {
    const pairs = generatePairsForType("edges", 7);
    const uses = new Map(EDGES.map((g) => [g.join(""), 0]));
    pairs.forEach(([a, b]) => {
      uses.set(edgePieceOf[a], uses.get(edgePieceOf[a]) + 1);
      uses.set(edgePieceOf[b], uses.get(edgePieceOf[b]) + 1);
    });
    for (const [key, count] of uses) {
      assert.ok(count <= 2, `klocek ${key} użyty ${count} razy`);
    }
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

// ─── generateSession ──────────────────────────────────────────────────────────
console.log("\ngenerateSession");
test("mode=corners: only corner pairs, no edge pairs", () => {
  const s = generateSession("corners", 4, 5);
  assert.ok(s.displayPairs.every((p) => p.type === "corner" || p.type === "corner-single"));
  assert.ok(s.answerPairs.every((p) => p.type === "corner" || p.type === "corner-single"));
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
test("mode=corners z ?-count: łączna liczba rogów (pary+singiel) ∈ {2,3,4,5}", () => {
  const valid = new Set([2, 3, 4, 5]);
  for (let i = 0; i < 100; i++) {
    const s = generateSession("corners", "?", 0);
    const pairCount = s.displayPairs.filter((p) => p.type === "corner").length;
    const singleCount = s.displayPairs.filter((p) => p.type === "corner-single").length;
    const total = pairCount + singleCount;
    assert.ok(valid.has(total), `nieoczekiwana łączna liczba rogów: ${total}`);
  }
});
test("mode=edges z ?-count: liczba par ∈ {4,5,6,7}", () => {
  const valid = new Set([4, 5, 6, 7]);
  for (let i = 0; i < 100; i++) {
    const s = generateSession("edges", 0, "?");
    assert.ok(valid.has(s.displayPairs.length),
      `nieoczekiwana liczba par: ${s.displayPairs.length}`);
  }
});
test("mode=corners z ręcznym 2,3,4,5: liczba par spójna z singlem", () => {
  for (let i = 0; i < 20; i++) {
    for (const n of [2, 3, 4, 5]) {
      const s = generateSession("corners", n, 0);
      const pairCount = s.displayPairs.filter((p) => p.type === "corner").length;
      const hasSingiel = s.displayPairs.some((p) => p.type === "corner-single");
      const expected = hasSingiel ? n - 1 : n;
      assert.strictEqual(pairCount, expected,
        `cc=${n}: oczekiwano ${expected} par (singiel=${hasSingiel}), got ${pairCount}`);
    }
  }
});
test("mode=edges z ręcznym 4,5,6,7: pełna liczba par", () => {
  for (let i = 0; i < 10; i++) {
    for (const n of [4, 5, 6, 7]) {
      const s = generateSession("edges", 0, n);
      assert.strictEqual(s.displayPairs.length, n,
        `oczekiwano ${n} par, got ${s.displayPairs.length}`);
    }
  }
});

// ─── corner-single (singiel) ──────────────────────────────────────────────────
console.log("\ncorner-single");
test("singiel pojawia się i nie pojawia przy '?' (rogi)", () => {
  let withSingiel = 0;
  let without = 0;
  for (let i = 0; i < 200; i++) {
    const s = generateSession("corners", "?", 0);
    if (s.displayPairs.some((p) => p.type === "corner-single")) withSingiel++;
    else without++;
  }
  assert.ok(withSingiel > 5, "singiel nie pojawił się ani razu w 200 sesjach");
  assert.ok(without > 5, "singiel pojawił się w każdej sesji");
});
test("singiel może pojawić się przy ręcznym wyborze 2, 3, 4 lub 5 rogów", () => {
  for (const n of [2, 3, 4, 5]) {
    let found = false;
    for (let i = 0; i < 100; i++) {
      const s = generateSession("corners", n, 0);
      if (s.displayPairs.some((p) => p.type === "corner-single")) { found = true; break; }
    }
    assert.ok(found, `singiel nie pojawił się przy cornerCount=${n} w 100 próbach`);
  }
});
test("singiel ma pair.length === 1", () => {
  for (let i = 0; i < 50; i++) {
    const s = generateSession("corners", 3, 0);
    s.displayPairs
      .filter((p) => p.type === "corner-single")
      .forEach((p) => assert.strictEqual(p.pair.length, 1));
  }
});
test("przy cc=2 singiel pochodzi z klocka nieużytego w parach", () => {
  for (let i = 0; i < 50; i++) {
    const s = generateSession("corners", 2, 0);
    const singles = s.displayPairs.filter((p) => p.type === "corner-single");
    if (singles.length === 0) continue;
    const usedLetters = new Set(
      s.displayPairs.filter((p) => p.type === "corner").flatMap((p) => p.pair)
    );
    singles.forEach(({ pair: [l] }) => {
      const piece = CORNERS.find((g) => g.includes(l));
      piece.forEach((pl) =>
        assert.ok(!usedLetters.has(pl), `litera ${pl} z kawałka singla użyta w parach`)
      );
    });
  }
});
test("singiel zawsze pochodzi z nieużytego kawałka (cc=3,4,5)", () => {
  for (const n of [3, 4, 5]) {
    for (let i = 0; i < 50; i++) {
      const s = generateSession("corners", n, 0);
      const singles = s.displayPairs.filter((p) => p.type === "corner-single");
      if (singles.length === 0) continue;
      const usedLetters = new Set(
        s.displayPairs.filter((p) => p.type === "corner").flatMap((p) => p.pair)
      );
      singles.forEach(({ pair: [l] }) => {
        const piece = CORNERS.find((g) => g.includes(l));
        piece.forEach((pl) =>
          assert.ok(!usedLetters.has(pl),
            `cc=${n}: litera ${pl} z kawałka singla użyta w parach`)
        );
      });
    }
  }
});
test("singiel pojawia się w trybie mixed przy '?'", () => {
  let found = false;
  for (let i = 0; i < 50; i++) {
    const s = generateSession("mixed", "?", 4);
    if (s.displayPairs.some((p) => p.type === "corner-single")) { found = true; break; }
  }
  assert.ok(found, "singiel nie pojawił się w żadnej z 50 sesji mixed");
});
test("singiel jest w answerPairs gdy jest w displayPairs", () => {
  const key = ({ pair, type }) => `${type}:${[...pair].sort().join("-")}`;
  let tested = 0;
  for (let i = 0; i < 100 && tested < 10; i++) {
    const s = generateSession("corners", "?", 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    assert.ok(s.answerPairs.some((p) => p.type === "corner-single"),
      "singiel w displayPairs ale brak w answerPairs");
    const d = s.displayPairs.map(key).sort();
    const a = s.answerPairs.map(key).sort();
    assert.deepStrictEqual(d, a, "displayPairs i answerPairs różnią się gdy singiel present");
  }
  assert.ok(tested > 0, "nie wygenerowano sesji z singlem w 100 próbach");
});
test("singiel w displayPairs: po parach rogów, przed krawędziami", () => {
  for (let i = 0; i < 100; i++) {
    const s = generateSession("mixed", "?", 4);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    const types = s.displayPairs.map((p) => p.type);
    const singielIdx = types.indexOf("corner-single");
    const lastCornerIdx = types.lastIndexOf("corner");
    const firstEdgeIdx = types.indexOf("edge");
    assert.ok(lastCornerIdx === -1 || lastCornerIdx < singielIdx,
      `singiel (${singielIdx}) przed ostatnim rogiem (${lastCornerIdx})`);
    assert.ok(firstEdgeIdx === -1 || singielIdx < firstEdgeIdx,
      `singiel (${singielIdx}) po pierwszej krawędzi (${firstEdgeIdx})`);
  }
});
test("w trybie edges brak singla", () => {
  for (let i = 0; i < 20; i++) {
    const s = generateSession("edges", 0, 4);
    assert.ok(!s.displayPairs.some((p) => p.type === "corner-single"));
  }
});

// ─── mechanika: ostatnia litera = włamanie ────────────────────────────────────
console.log("\nmechanika: ostatnia litera = włamanie");

const pieceOfCorner = (l) => CORNERS.find((g) => g.includes(l)).join("");
const pieceOfEdge   = (l) => EDGES.find((g) => g.includes(l)).join("");

test("Tryb B corners 4 pary: para 3 = [włamanie, nowy], para 4 = [nowy, zamknięcie z par 3+]", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("corners", 4, false);
    assert.strictEqual(pairs.length, 4);

    const piecesUsedIn = new Map();
    pairs.forEach(([a, b], idx) => {
      const pa = pieceOfCorner(a);
      const pb = pieceOfCorner(b);
      if (!piecesUsedIn.has(pa)) piecesUsedIn.set(pa, []);
      if (!piecesUsedIn.has(pb)) piecesUsedIn.set(pb, []);
      piecesUsedIn.get(pa).push(idx + 1);
      piecesUsedIn.get(pb).push(idx + 1);
    });

    // para 3: 1. litera = włamanie (klocek z par 1-2)
    const pair3First = pieceOfCorner(pairs[2][0]);
    const usedIn12 = new Set(pairs.slice(0, 2).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
    assert.ok(usedIn12.has(pair3First), `para 3: 1. litera ${pairs[2][0]} nie jest włamaniem`);

    // para 3: 2. litera = nowy klocek
    const pair3Second = pieceOfCorner(pairs[2][1]);
    assert.ok(!usedIn12.has(pair3Second), `para 3: 2. litera ${pairs[2][1]} nie jest z nowego klocka`);

    // para 4: 1. litera = nowy klocek
    const usedIn123 = new Set(pairs.slice(0, 3).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
    const pair4First = pieceOfCorner(pairs[3][0]);
    assert.ok(!usedIn123.has(pair4First), `para 4: 1. litera ${pairs[3][0]} nie jest z nowego klocka`);

    // para 4: 2. litera = zamknięcie z klocka który pojawił się w parach 3+ (nie z par 1-2)
    const pair4Second = pieceOfCorner(pairs[3][1]);
    const firstUsage = piecesUsedIn.get(pair4Second)[0];
    assert.ok(firstUsage >= 3, `para 4: 2. litera ${pairs[3][1]} (klocek ${pair4Second}) pierwszy raz użyty w parze ${firstUsage}, nie w 3+`);
  }
});
test("Tryb B corners 5 par: pary 3-4 = [włamanie, nowy], para 5 = [nowy, zamknięcie z par 3+]", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("corners", 5, false);
    assert.strictEqual(pairs.length, 5);

    const piecesUsedIn = new Map();
    pairs.forEach(([a, b], idx) => {
      const pa = pieceOfCorner(a);
      const pb = pieceOfCorner(b);
      if (!piecesUsedIn.has(pa)) piecesUsedIn.set(pa, []);
      if (!piecesUsedIn.has(pb)) piecesUsedIn.set(pb, []);
      piecesUsedIn.get(pa).push(idx + 1);
      piecesUsedIn.get(pb).push(idx + 1);
    });

    // pary 3 i 4: 1. litera = włamanie, 2. litera = nowy
    for (const pairIdx of [2, 3]) {
      const usedBefore = new Set(pairs.slice(0, pairIdx).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
      const first = pieceOfCorner(pairs[pairIdx][0]);
      const second = pieceOfCorner(pairs[pairIdx][1]);
      assert.ok(usedBefore.has(first), `para ${pairIdx + 1}: 1. litera ${pairs[pairIdx][0]} nie jest włamaniem`);
      assert.ok(!usedBefore.has(second), `para ${pairIdx + 1}: 2. litera ${pairs[pairIdx][1]} nie jest z nowego klocka`);
    }

    // para 5: 1. litera = nowy klocek
    const usedIn1234 = new Set(pairs.slice(0, 4).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
    const pair5First = pieceOfCorner(pairs[4][0]);
    assert.ok(!usedIn1234.has(pair5First), `para 5: 1. litera ${pairs[4][0]} nie jest z nowego klocka`);

    // para 5: 2. litera = zamknięcie z klocka który pojawił się w parach 3+ (nie z par 1-2)
    const pair5Second = pieceOfCorner(pairs[4][1]);
    const firstUsage = piecesUsedIn.get(pair5Second)[0];
    assert.ok(firstUsage >= 3, `para 5: 2. litera ${pairs[4][1]} (klocek ${pair5Second}) pierwszy raz użyty w parze ${firstUsage}, nie w 3+`);
  }
});
test("Tryb B edges 6 par: ostatnia litera ostatniej pary jest włamaniem", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("edges", 6, false);
    assert.strictEqual(pairs.length, 6);
    const lastLetter = pairs[5][1];
    const usedBefore = new Set(pairs.slice(0, 5).flatMap(([a, b]) => [pieceOfEdge(a), pieceOfEdge(b)]));
    assert.ok(usedBefore.has(pieceOfEdge(lastLetter)),
      `ostatnia litera ${lastLetter} (klocek ${pieceOfEdge(lastLetter)}) nie jest włamaniem`);
  }
});
test("Tryb B edges 7 par: ostatnia litera ostatniej pary jest włamaniem", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("edges", 7, false);
    assert.strictEqual(pairs.length, 7);
    const lastLetter = pairs[6][1];
    const usedBefore = new Set(pairs.slice(0, 6).flatMap(([a, b]) => [pieceOfEdge(a), pieceOfEdge(b)]));
    assert.ok(usedBefore.has(pieceOfEdge(lastLetter)),
      `ostatnia litera ${lastLetter} (klocek ${pieceOfEdge(lastLetter)}) nie jest włamaniem`);
  }
});
test("generateSession edges 6-7: ostatnia litera ostatniej pary krawędzi jest włamaniem", () => {
  for (const ec of [6, 7]) {
    for (let i = 0; i < 30; i++) {
      const s = generateSession("edges", 0, ec);
      const edgePairs = s.displayPairs.filter((p) => p.type === "edge").map((p) => p.pair);
      assert.strictEqual(edgePairs.length, ec);
      const lastLetter = edgePairs[ec - 1][1];
      const usedBefore = new Set(
        edgePairs.slice(0, ec - 1).flatMap(([a, b]) => [pieceOfEdge(a), pieceOfEdge(b)])
      );
      assert.ok(usedBefore.has(pieceOfEdge(lastLetter)),
        `ec=${ec}: ostatnia litera ${lastLetter} (klocek ${pieceOfEdge(lastLetter)}) nie jest włamaniem`);
    }
  }
});
test("generateSession corners 4 pary bez singla: ostatnia litera ostatniej pary jest włamaniem", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    const cornerPairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    if (s.displayPairs.some((p) => p.type === "corner-single")) continue;
    assert.strictEqual(cornerPairs.length, 4);
    const lastLetter = cornerPairs[3][1];
    const usedBefore = new Set(
      cornerPairs.slice(0, 3).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)])
    );
    assert.ok(usedBefore.has(pieceOfCorner(lastLetter)),
      `ostatnia litera ${lastLetter} (klocek ${pieceOfCorner(lastLetter)}) nie jest włamaniem`);
    tested++;
  }
  assert.ok(tested > 0, "nie wygenerowano sesji 4 par bez singla w 200 próbach");
});
// ─── zasada kolejności ────────────────────────────────────────────────────────
console.log("\nzasada kolejności");
test("2. litera pary N ≠ 1. litera pary N+1 (corners)", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [2, 3, 4, 5]) {
      const pairs = generatePairsForType("corners", n);
      for (let j = 0; j < pairs.length - 1; j++) {
        assert.notStrictEqual(
          pairs[j][1], pairs[j + 1][0],
          `corners n=${n}: para ${j}[1]='${pairs[j][1]}' === para ${j + 1}[0]`
        );
      }
    }
  }
});
test("2. litera pary N ≠ 1. litera pary N+1 (edges)", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [4, 5, 6, 7]) {
      const pairs = generatePairsForType("edges", n);
      for (let j = 0; j < pairs.length - 1; j++) {
        assert.notStrictEqual(
          pairs[j][1], pairs[j + 1][0],
          `edges n=${n}: para ${j}[1]='${pairs[j][1]}' === para ${j + 1}[0]`
        );
      }
    }
  }
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
