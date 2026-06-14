// node --experimental-vm-modules test.js  OR  node test.js (Node 22+)
import assert from "node:assert";
import {
  CORNERS, EDGES,
  CORNER_VARIANTS, EDGE_WEIGHTS,
  weightedRandom, weightedRandomVariant, shuffle, getBlockedLetters,
  validateSchema, validateSchema4BLD,
} from "./js/schema.js";
import { generatePairsForType } from "./js/generator.js";
import { generateSession } from "./js/generator3bld.js";
import { generate4BLDSession } from "./js/generator4bld.js";
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

// ─── weightedRandom / weightedRandomVariant ───────────────────────────────────
console.log("\nweightedRandom / weightedRandomVariant");
const validCornerVariants = new Set(CORNER_VARIANTS.map((v) => v.variant));
const validEdgeValues = new Set(EDGE_WEIGHTS.map((o) => o.value));

test("weightedRandomVariant always returns a variant from CORNER_VARIANTS", () => {
  for (let i = 0; i < 200; i++) {
    const v = weightedRandomVariant(CORNER_VARIANTS);
    assert.ok(validCornerVariants.has(v.variant), `unexpected variant: ${v.variant}`);
  }
});
test("weightedRandom always returns a value from EDGE_WEIGHTS", () => {
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
test("Tryb B (corners, count=5): tylko para 1 ma unikalne kawałki", () => {
  for (let i = 0; i < 30; i++) {
    const pairs = generatePairsForType("corners", 5, false);
    assert.strictEqual(pairs.length, 5, `oczekiwano 5 par, got ${pairs.length}`);
    assert.notStrictEqual(cornerPieceOf[pairs[0][0]], cornerPieceOf[pairs[0][1]],
      `para 1 ma litery z tego samego kawałka`);
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
    const s = generateSession("edges", 2, "?");
    assert.ok(valid.has(s.displayPairs.length),
      `nieoczekiwana liczba par: ${s.displayPairs.length}`);
  }
});
test("mode=corners z ręcznym 2,3,4,5: liczba par zgodna", () => {
  for (let i = 0; i < 20; i++) {
    for (const n of [2, 3, 4, 5]) {
      const s = generateSession("corners", n, 0);
      const pairCount = s.displayPairs.filter((p) => p.type === "corner").length;
      assert.strictEqual(pairCount, n,
        `cc=${n}: oczekiwano ${n} par, got ${pairCount}`);
    }
  }
});
test("mode=corners z ręcznym 2,3,4: singiel pojawia się ~50% (losowanie)", () => {
  for (const n of [2, 3, 4]) {
    let withSingiel = 0;
    for (let i = 0; i < 100; i++) {
      const s = generateSession("corners", n, 0);
      if (s.displayPairs.some((p) => p.type === "corner-single")) withSingiel++;
    }
    assert.ok(withSingiel > 20 && withSingiel < 80,
      `cc=${n}: singiel pojawił się ${withSingiel}/100 razy (oczekiwano ~50)`);
  }
});
test("mode=corners z 5 parami: nigdy singiel (wariant 5 nie ma +1)", () => {
  for (let i = 0; i < 50; i++) {
    const s = generateSession("corners", 5, 0);
    assert.ok(!s.displayPairs.some((p) => p.type === "corner-single"),
      "wariant 5: nie powinno być singla");
  }
});
test("mode=edges z ręcznym 4,5,6,7: pełna liczba par", () => {
  for (let i = 0; i < 10; i++) {
    for (const n of [4, 5, 6, 7]) {
      const s = generateSession("edges", 2, n);
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
test("singiel ma pair.length === 1", () => {
  let tested = 0;
  for (let i = 0; i < 100 && tested < 20; i++) {
    const s = generateSession("corners", 3, 0);
    const singles = s.displayPairs.filter((p) => p.type === "corner-single");
    if (singles.length === 0) continue;
    tested++;
    singles.forEach((p) => assert.strictEqual(p.pair.length, 1));
  }
  assert.ok(tested > 0, "nie wygenerowano sesji z singlem");
});
test("cc=2,3 z singlem: singiel pochodzi z nieużytego kawałka (Tryb A)", () => {
  for (const cc of [2, 3]) {
    let tested = 0;
    for (let i = 0; i < 100 && tested < 20; i++) {
      const s = generateSession("corners", cc, 0);
      const singles = s.displayPairs.filter((p) => p.type === "corner-single");
      if (singles.length === 0) continue;
      tested++;
      const usedLetters = new Set(
        s.displayPairs.filter((p) => p.type === "corner").flatMap((p) => p.pair)
      );
      singles.forEach(({ pair: [l] }) => {
        const piece = CORNERS.find((g) => g.includes(l));
        piece.forEach((pl) =>
          assert.ok(!usedLetters.has(pl), `cc=${cc}: litera ${pl} z kawałka singla użyta w parach`)
        );
      });
    }
    assert.ok(tested > 0, `cc=${cc}: nie wygenerowano sesji z singlem`);
  }
});
test("cc=4 z singlem: singiel pochodzi z otwartego kawałka (Tryb B)", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    const singles = s.displayPairs.filter((p) => p.type === "corner-single");
    if (singles.length === 0) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const pieceUses = new Map();
    pairs.forEach(([a, b]) => {
      const pa = CORNERS.find((g) => g.includes(a)).join("");
      const pb = CORNERS.find((g) => g.includes(b)).join("");
      pieceUses.set(pa, (pieceUses.get(pa) || 0) + 1);
      pieceUses.set(pb, (pieceUses.get(pb) || 0) + 1);
    });
    singles.forEach(({ pair: [l] }) => {
      const piece = CORNERS.find((g) => g.includes(l)).join("");
      assert.ok(pieceUses.get(piece) === 1,
        `4+1: singiel ${l} (kawałek ${piece}) nie pochodzi z otwartego kawałka (uses=${pieceUses.get(piece)})`);
    });
  }
  assert.ok(tested > 0, "nie wygenerowano sesji 4+1");
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
    const s = generateSession("edges", 2, 4);
    assert.ok(!s.displayPairs.some((p) => p.type === "corner-single"));
  }
});

// ─── mechanika: ostatnia litera = włamanie ────────────────────────────────────
console.log("\nmechanika: ostatnia litera = włamanie");

const pieceOfCorner = (l) => CORNERS.find((g) => g.includes(l)).join("");
const pieceOfEdge   = (l) => EDGES.find((g) => g.includes(l)).join("");

function countRepeats(pairs, pieceOf) {
  const pieceUsage = new Map();
  pairs.forEach(([a, b]) => {
    const pa = pieceOf(a);
    const pb = pieceOf(b);
    pieceUsage.set(pa, (pieceUsage.get(pa) || 0) + 1);
    pieceUsage.set(pb, (pieceUsage.get(pb) || 0) + 1);
  });
  return [...pieceUsage.values()].filter(v => v === 2).length;
}

test("Tryb B corners 4 pary: 1 powtórka, ostatnia litera = zamknięcie", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("corners", 4, false);
    assert.strictEqual(pairs.length, 4);
    assert.strictEqual(countRepeats(pairs, pieceOfCorner), 1, "powinny być dokładnie 1 powtórka");

    const lastLetter = pairs[3][1];
    const usedBefore = new Set(pairs.slice(0, 3).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
    assert.ok(usedBefore.has(pieceOfCorner(lastLetter)),
      `ostatnia litera ${lastLetter} nie jest zamknięciem`);
  }
});

test("Tryb B corners 5 par: 3 powtórki, ostatnia litera = zamknięcie", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("corners", 5, false);
    assert.strictEqual(pairs.length, 5);
    assert.strictEqual(countRepeats(pairs, pieceOfCorner), 3, "powinny być dokładnie 3 powtórki");

    const lastLetter = pairs[4][1];
    const usedBefore = new Set(pairs.slice(0, 4).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
    assert.ok(usedBefore.has(pieceOfCorner(lastLetter)),
      `ostatnia litera ${lastLetter} nie jest zamknięciem`);
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
      const s = generateSession("edges", 2, ec);
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
test("generateSession corners cc=4 bez singla: ostatnia litera ostatniej pary jest włamaniem", () => {
  let tested = 0;
  for (let i = 0; i < 100 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    if (s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const cornerPairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    assert.strictEqual(cornerPairs.length, 4);
    const lastLetter = cornerPairs[3][1];
    const usedBefore = new Set(
      cornerPairs.slice(0, 3).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)])
    );
    assert.ok(usedBefore.has(pieceOfCorner(lastLetter)),
      `ostatnia litera ${lastLetter} (klocek ${pieceOfCorner(lastLetter)}) nie jest włamaniem`);
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=4 bez singla");
});
// ─── cc=3 z singlem: tryb A dla par ──────────────────────────────────────────
console.log("\ncc=3 z singlem: tryb A dla par");
test("cc=3 z singlem: każdy kawałek w co najwyżej 1 parze (blokada grupowa)", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 50; i++) {
    const s = generateSession("corners", 3, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const cornerPairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const usedPieces = new Set();
    cornerPairs.forEach(([a, b], idx) => {
      const pa = pieceOfCorner(a);
      const pb = pieceOfCorner(b);
      assert.ok(!usedPieces.has(pa), `kawałek ${pa} (${a}, para ${idx + 1}) powtórzony`);
      assert.ok(!usedPieces.has(pb), `kawałek ${pb} (${b}, para ${idx + 1}) powtórzony`);
      usedPieces.add(pa);
      usedPieces.add(pb);
    });
    const singleLetter = s.displayPairs.find((p) => p.type === "corner-single").pair[0];
    const singlePiece = pieceOfCorner(singleLetter);
    assert.ok(!usedPieces.has(singlePiece),
      `singiel (${singleLetter}, kawałek ${singlePiece}) w kawałku użytym w parach`);
  }
  assert.ok(tested >= 30, `za mało sesji cc=3 z singlem: ${tested}`);
});
test("cc=4 bez singla używa Trybu B: 1 powtórka", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 50; i++) {
    const s = generateSession("corners", 4, 0);
    if (s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    assert.strictEqual(pairs.length, 4);
    assert.strictEqual(countRepeats(pairs, pieceOfCorner), 1, "cc=4 bez singla: powinna być 1 powtórka");
  }
  assert.ok(tested >= 30, `za mało sesji cc=4 bez singla: ${tested}`);
});

// ─── cc=4 z singlem: tryb B z 2 powtórkami ───────────────────────────────────
console.log("\ncc=4 z singlem: tryb B z 2 powtórkami");
test("cc=4 z singlem: 4 pary + singiel", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const singles = s.displayPairs.filter((p) => p.type === "corner-single");
    assert.strictEqual(pairs.length, 4, "oczekiwano 4 par");
    assert.strictEqual(singles.length, 1, "oczekiwano 1 singiel");
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=4 z singlem");
});
test("cc=4 z singlem: dokładnie 1 powtórka w parach (singiel jest drugą)", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    assert.strictEqual(countRepeats(pairs, pieceOfCorner), 1, "4+1: powinna być 1 powtórka w parach");
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=4 z singlem");
});
test("cc=4 z singlem: powtórka w parze 2 lub 3", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const pieceUses = new Map();
    let repeatPairIdx = -1;
    pairs.forEach(([a, b], idx) => {
      const pa = pieceOfCorner(a);
      const pb = pieceOfCorner(b);
      for (const p of [pa, pb]) {
        const prev = pieceUses.get(p) || 0;
        pieceUses.set(p, prev + 1);
        if (prev === 1) repeatPairIdx = idx;
      }
    });
    assert.ok(repeatPairIdx === 1 || repeatPairIdx === 2,
      `powtórka w parze ${repeatPairIdx + 1}, oczekiwano 2 lub 3`);
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=4 z singlem");
});
test("cc=4 z singlem: singiel z otwartego kawałka (uses=1)", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const singles = s.displayPairs.filter((p) => p.type === "corner-single");
    const pieceUses = new Map();
    pairs.forEach(([a, b]) => {
      const pa = pieceOfCorner(a);
      const pb = pieceOfCorner(b);
      pieceUses.set(pa, (pieceUses.get(pa) || 0) + 1);
      pieceUses.set(pb, (pieceUses.get(pb) || 0) + 1);
    });
    singles.forEach(({ pair: [l] }) => {
      const piece = pieceOfCorner(l);
      assert.strictEqual(pieceUses.get(piece), 1,
        `singiel ${l} (kawałek ${piece}) nie pochodzi z otwartego kawałka (uses=${pieceUses.get(piece)})`);
    });
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=4 z singlem");
});

// ─── blokada pętli (edges Tryb B) ─────────────────────────────────────────────
console.log("\nblokada pętli (edges Tryb B)");
test("Tryb B edges: zamknięcie cyklu blokuje wszystkie otwarte kawałki", () => {
  for (let i = 0; i < 200; i++) {
    const pairs = generatePairsForType("edges", 7, false);
    assert.strictEqual(pairs.length, 7);

    const blocked = new Set();
    const pieceUses = new Map();

    pairs.forEach(([a, b], idx) => {
      const pa = pieceOfEdge(a);
      const pb = pieceOfEdge(b);

      if (idx >= 2) {
        assert.ok(!blocked.has(pa), `para ${idx + 1}: kawałek ${pa} jest zablokowany ale nie powinien`);
        assert.ok(!blocked.has(pb), `para ${idx + 1}: kawałek ${pb} jest zablokowany ale nie powinien`);
      }

      for (const p of [pa, pb]) {
        const prevUses = pieceUses.get(p) || 0;
        pieceUses.set(p, prevUses + 1);

        if (prevUses === 1) {
          for (const [key, uses] of pieceUses) {
            if (uses === 1 && key !== p) {
              blocked.add(key);
            }
          }
        }
      }
    });
  }
});

// ─── zasada kolejności ────────────────────────────────────────────────────────
console.log("\nzasada kolejności");
test("kawałek 2. litery pary N ≠ kawałek 1. litery pary N+1 (corners)", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [2, 3, 4, 5]) {
      const pairs = generatePairsForType("corners", n);
      for (let j = 0; j < pairs.length - 1; j++) {
        assert.notStrictEqual(
          cornerPieceOf[pairs[j][1]], cornerPieceOf[pairs[j + 1][0]],
          `corners n=${n}: para ${j}[1]='${pairs[j][1]}' i para ${j + 1}[0]='${pairs[j + 1][0]}' z tego samego kawałka`
        );
      }
    }
  }
});
test("kawałek 2. litery pary N ≠ kawałek 1. litery pary N+1 (edges)", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [4, 5, 6, 7]) {
      const pairs = generatePairsForType("edges", n);
      for (let j = 0; j < pairs.length - 1; j++) {
        assert.notStrictEqual(
          edgePieceOf[pairs[j][1]], edgePieceOf[pairs[j + 1][0]],
          `edges n=${n}: para ${j}[1]='${pairs[j][1]}' i para ${j + 1}[0]='${pairs[j + 1][0]}' z tego samego kawałka`
        );
      }
    }
  }
});


// ─── 4BLD wingsy z powtórką ───────────────────────────────────────────────────
console.log("\n4BLD wingsy z powtórką (12 par)");
test("wingsy 12 par: dokładnie 1 powtórzona litera", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("wings", 2, 12, 6);
    const wingsPairs = s.displayPairs.filter((p) => p.type === "wing").map((p) => p.pair);
    if (wingsPairs.length !== 12) continue;
    const letterCounts = new Map();
    wingsPairs.flat().forEach((l) => {
      letterCounts.set(l, (letterCounts.get(l) || 0) + 1);
    });
    const repeats = [...letterCounts.values()].filter((c) => c === 2);
    assert.strictEqual(repeats.length, 1, "powinna być dokładnie 1 powtórzona litera");
  }
});
test("wingsy 12 par: powtórzona litera nie w tej samej parze", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("wings", 2, 12, 6);
    const wingsPairs = s.displayPairs.filter((p) => p.type === "wing").map((p) => p.pair);
    if (wingsPairs.length !== 12) continue;
    wingsPairs.forEach(([a, b], idx) => {
      assert.notStrictEqual(a, b, `para ${idx + 1}: ta sama litera ${a} w parze`);
    });
  }
});
test("wingsy 12 par: powtórzona litera nie w sąsiednich parach", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("wings", 2, 12, 6);
    const wingsPairs = s.displayPairs.filter((p) => p.type === "wing").map((p) => p.pair);
    if (wingsPairs.length !== 12) continue;
    const letterCounts = new Map();
    wingsPairs.flat().forEach((l) => {
      letterCounts.set(l, (letterCounts.get(l) || 0) + 1);
    });
    const repeatLetter = [...letterCounts.entries()].find(([, c]) => c === 2)?.[0];
    if (!repeatLetter) continue;
    const pairsWithRepeat = [];
    wingsPairs.forEach((pair, idx) => {
      if (pair.includes(repeatLetter)) pairsWithRepeat.push(idx);
    });
    assert.strictEqual(pairsWithRepeat.length, 2, "powtórka powinna być w 2 parach");
    assert.ok(Math.abs(pairsWithRepeat[0] - pairsWithRepeat[1]) > 1,
      `powtórka ${repeatLetter} w sąsiednich parach ${pairsWithRepeat[0] + 1} i ${pairsWithRepeat[1] + 1}`);
  }
});
test("wingsy 12 par: zasada kolejności (2. litera pary N ≠ 1. litera pary N+1)", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("wings", 2, 12, 6);
    const wingsPairs = s.displayPairs.filter((p) => p.type === "wing").map((p) => p.pair);
    if (wingsPairs.length !== 12) continue;
    for (let j = 0; j < wingsPairs.length - 1; j++) {
      assert.notStrictEqual(wingsPairs[j][1], wingsPairs[j + 1][0],
        `para ${j + 1}[1]='${wingsPairs[j][1]}' = para ${j + 2}[0]='${wingsPairs[j + 1][0]}'`);
    }
  }
});

// ─── validateSchema ───────────────────────────────────────────────────────────
console.log("\nvalidateSchema");

const validCorners = [
  ["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"],
  ["J", "K", "L"], ["M", "N", "O"], ["P", "R", "S"],
  ["T", "U", "W"],
];
const validEdges = [
  ["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"],
  ["K", "L"], ["M", "N"], ["O", "P"], ["R", "S"], ["T", "U"],
  ["W", "X"],
];

test("akceptuje poprawny schemat", () => {
  assert.strictEqual(validateSchema(validCorners, validEdges), null);
});
test("odrzuca pusty schemat rogów", () => {
  assert.ok(validateSchema([], validEdges) !== null);
});
test("odrzuca pusty schemat krawędzi", () => {
  assert.ok(validateSchema(validCorners, []) !== null);
});
test("odrzuca niepełną grupę rogów", () => {
  const bad = validCorners.map(g => [...g]);
  bad[2][1] = "";
  assert.ok(validateSchema(bad, validEdges)?.includes("rogów 3"));
});
test("odrzuca niepełną grupę krawędzi", () => {
  const bad = validEdges.map(g => [...g]);
  bad[5][0] = "";
  assert.ok(validateSchema(validCorners, bad)?.includes("krawędzi 6"));
});
test("odrzuca duplikat w grupie rogów", () => {
  const bad = validCorners.map(g => [...g]);
  bad[0][1] = "A";
  assert.ok(validateSchema(bad, validEdges)?.includes("Powtórzona"));
});
test("odrzuca duplikat między grupami rogów", () => {
  const bad = validCorners.map(g => [...g]);
  bad[3][0] = "A";
  assert.ok(validateSchema(bad, validEdges)?.includes("Powtórzona"));
});
test("odrzuca duplikat między grupami krawędzi", () => {
  const bad = validEdges.map(g => [...g]);
  bad[7][0] = "A";
  assert.ok(validateSchema(validCorners, bad)?.includes("Powtórzona"));
});
test("akceptuje Ł jako literę", () => {
  const corners = validCorners.map(g => [...g]);
  corners[6][2] = "Ł";
  assert.strictEqual(validateSchema(corners, validEdges), null);
});

// ─── validateSchema4BLD ───────────────────────────────────────────────────────
console.log("\nvalidateSchema4BLD");

const valid4Corners = validCorners;
const validWings = "ABCDEFGHIKLMNOPRSTUWXZŁ".split("").map(l => [l]);
const validCenters = "ABCDEFGHIKLMNOPRSTUWXZŁ".split("").map(l => [l]);

test("akceptuje poprawny schemat 4BLD", () => {
  assert.strictEqual(validateSchema4BLD(valid4Corners, validWings, validCenters), null);
});
test("odrzuca niepełne wingsy", () => {
  const bad = validWings.slice(0, 20);
  assert.ok(validateSchema4BLD(valid4Corners, bad, validCenters)?.includes("wingsów"));
});
test("odrzuca niepełne centry", () => {
  const bad = validCenters.slice(0, 15);
  assert.ok(validateSchema4BLD(valid4Corners, validWings, bad)?.includes("centrów"));
});
test("odrzuca duplikat w wingsach", () => {
  const bad = validWings.map(g => [...g]);
  bad[10][0] = "A";
  assert.ok(validateSchema4BLD(valid4Corners, bad, validCenters)?.includes("wingsach"));
});
test("odrzuca duplikat w centrach", () => {
  const bad = validCenters.map(g => [...g]);
  bad[5][0] = "A";
  assert.ok(validateSchema4BLD(valid4Corners, validWings, bad)?.includes("centrach"));
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
