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
import { generate5BLDSession } from "./js/generator5bld.js";
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

// ─── formatTime ───────────────────────────────────────────────────────────────
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
  assert.ok(!blocked.has("O"), "O nie powinno być zablokowane");
  assert.ok(!blocked.has("L"), "L nie powinno być zablokowane");
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

test("returns requested count", () => {
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
test("both letters are valid corner letters", () => {
  generatePairsForType("corners", 5).forEach(([a, b]) => {
    assert.ok(allCornerLetters.has(a), `unknown letter ${a}`);
    assert.ok(allCornerLetters.has(b), `unknown letter ${b}`);
  });
});
test("no pair uses two letters from the same piece", () => {
  for (let i = 0; i < 20; i++) {
    generatePairsForType("corners", 5).forEach(([a, b]) =>
      assert.notStrictEqual(cornerPieceOf[a], cornerPieceOf[b], `same piece: ${a}-${b}`)
    );
  }
});
test("no piece used more than twice", () => {
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
  for (let i = 0; i < 50; i++) {
    for (const n of [4, 5, 6, 7]) {
      const pairs = generatePairsForType("edges", n);
      assert.strictEqual(pairs.length, n, `expected ${n} pairs, got ${pairs.length}`);
    }
  }
});
test("both letters are valid edge letters", () => {
  generatePairsForType("edges", 7).forEach(([a, b]) => {
    assert.ok(allEdgeLetters.has(a), `unknown letter ${a}`);
    assert.ok(allEdgeLetters.has(b), `unknown letter ${b}`);
  });
});
test("no pair uses two letters from the same piece", () => {
  for (let i = 0; i < 20; i++) {
    generatePairsForType("edges", 7).forEach(([a, b]) =>
      assert.notStrictEqual(edgePieceOf[a], edgePieceOf[b], `same piece: ${a}-${b}`)
    );
  }
});
test("no piece used more than twice", () => {
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

test("Tryb A corners count=3: wszystkie pary mają unikalne kawałki", () => {
  for (let i = 0; i < 50; i++) {
    const pairs = generatePairsForType("corners", 3, true);
    for (let j = 0; j < pairs.length; j++) {
      for (let k = j + 1; k < pairs.length; k++) {
        for (const lj of pairs[j]) {
          const group = cornerGroupOf(lj);
          for (const lk of pairs[k]) {
            assert.ok(!group.includes(lk),
              `litera ${lk} (para ${k}) w grupie litery ${lj} (para ${j})`);
          }
        }
      }
    }
  }
});
test("Tryb A edges count=5: wszystkie pary mają unikalne kawałki", () => {
  for (let i = 0; i < 50; i++) {
    const pairs = generatePairsForType("edges", 5, true);
    for (let j = 0; j < pairs.length; j++) {
      for (let k = j + 1; k < pairs.length; k++) {
        for (const lj of pairs[j]) {
          const group = edgeGroupOf(lj);
          for (const lk of pairs[k]) {
            assert.ok(!group.includes(lk),
              `litera ${lk} (para ${k}) w grupie litery ${lj} (para ${j})`);
          }
        }
      }
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
test("mode=corners: tylko rogi", () => {
  const s = generateSession("corners", 4, 5);
  assert.ok(s.displayPairs.every((p) => p.type === "corner" || p.type === "corner-single"));
});
test("mode=edges: tylko krawędzie", () => {
  const s = generateSession("edges", 4, 5);
  assert.ok(s.displayPairs.every((p) => p.type === "edge"));
});
test("mode=mixed: oba typy", () => {
  const s = generateSession("mixed", 4, 5);
  assert.ok(s.displayPairs.some((p) => p.type === "corner"));
  assert.ok(s.displayPairs.some((p) => p.type === "edge"));
});
test("displayPairs: rogi przed krawędziami", () => {
  const s = generateSession("mixed", 4, 5);
  const types = s.displayPairs.map((p) => p.type);
  const firstEdge = types.indexOf("edge");
  const lastCorner = types.lastIndexOf("corner");
  assert.ok(firstEdge === -1 || lastCorner < firstEdge);
});
test("answerPairs: krawędzie przed rogami", () => {
  const s = generateSession("mixed", 4, 5);
  const types = s.answerPairs.map((p) => p.type);
  const firstCorner = types.indexOf("corner");
  const lastEdge = types.lastIndexOf("edge");
  assert.ok(firstCorner === -1 || lastEdge < firstCorner);
});
test("displayPairs i answerPairs zawierają te same pary", () => {
  const s = generateSession("mixed", 4, 5);
  const key = ({ pair, type }) => `${type}:${[...pair].sort().join("-")}`;
  assert.deepStrictEqual(s.displayPairs.map(key).sort(), s.answerPairs.map(key).sort());
});
test("?: łączna liczba rogów ∈ {2,3,4,5}", () => {
  const valid = new Set([2, 3, 4, 5]);
  for (let i = 0; i < 100; i++) {
    const s = generateSession("corners", "?", 0);
    const total = s.displayPairs.filter((p) => p.type === "corner" || p.type === "corner-single").length;
    assert.ok(valid.has(total), `nieoczekiwana liczba rogów: ${total}`);
  }
});
test("?: liczba krawędzi ∈ {4,5,6,7}", () => {
  const valid = new Set([4, 5, 6, 7]);
  for (let i = 0; i < 100; i++) {
    const s = generateSession("edges", 2, "?");
    assert.ok(valid.has(s.displayPairs.length), `nieoczekiwana liczba par: ${s.displayPairs.length}`);
  }
});
test("cc=2,3,4,5: liczba elementów zgodna (pary + singiel)", () => {
  for (let i = 0; i < 20; i++) {
    for (const n of [2, 3, 4, 5]) {
      const s = generateSession("corners", n, 0);
      const total = s.displayPairs.filter((p) => p.type === "corner" || p.type === "corner-single").length;
      assert.strictEqual(total, n, `cc=${n}: oczekiwano ${n} elementów, got ${total}`);
    }
  }
});
test("cc=3,4,5: singiel ~50%", () => {
  for (const n of [3, 4, 5]) {
    let withSingiel = 0;
    for (let i = 0; i < 100; i++) {
      const s = generateSession("corners", n, 0);
      if (s.displayPairs.some((p) => p.type === "corner-single")) withSingiel++;
    }
    assert.ok(withSingiel > 20 && withSingiel < 80,
      `cc=${n}: singiel ${withSingiel}/100 razy`);
  }
});
test("cc=2: nigdy singiel", () => {
  for (let i = 0; i < 50; i++) {
    const s = generateSession("corners", 2, 0);
    assert.ok(!s.displayPairs.some((p) => p.type === "corner-single"));
  }
});

// ─── corner-single ────────────────────────────────────────────────────────────
console.log("\ncorner-single");
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
test("cc=3,4: singiel z nieużytego kawałka (tryb A: 2+1, 3+1)", () => {
  for (const cc of [3, 4]) {
    let tested = 0;
    for (let i = 0; i < 100 && tested < 20; i++) {
      const s = generateSession("corners", cc, 0);
      const singles = s.displayPairs.filter((p) => p.type === "corner-single");
      if (singles.length === 0) continue;
      const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
      // Tryb A (2+1, 3+1) = max 3 pary, singiel z nieużytego kawałka
      if (pairs.length > 3) continue;
      tested++;
      const usedLetters = new Set(pairs.flatMap((p) => p));
      singles.forEach(({ pair: [l] }) => {
        const piece = CORNERS.find((g) => g.includes(l));
        piece.forEach((pl) =>
          assert.ok(!usedLetters.has(pl), `cc=${cc}: litera ${pl} z kawałka singla użyta w parach`)
        );
      });
    }
    assert.ok(tested > 0, `cc=${cc}: nie wygenerowano sesji z singlem w trybie A`);
  }
});
test("cc=5 z singlem (4+1): singiel z otwartego kawałka (uses=1)", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 5, 0);
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
        `singiel ${l} (kawałek ${piece}) uses=${pieceUses.get(piece)}`);
    });
  }
  assert.ok(tested > 0, "nie wygenerowano sesji 4+1");
});
test("cc=5 z singlem (4+1): singiel z kawałka uwięzionego między powtórkami", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 5, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const single = s.displayPairs.find((p) => p.type === "corner-single").pair[0];

    const piecePositions = new Map();
    pairs.forEach(([a, b], idx) => {
      for (const l of [a, b]) {
        const p = cornerPieceOf[l];
        if (!piecePositions.has(p)) piecePositions.set(p, []);
        piecePositions.get(p).push(idx);
      }
    });
    const [repeatKey, positions] = [...piecePositions.entries()].find(([, pos]) => pos.length === 2);
    const [firstUse, secondUse] = positions;

    const trappedPieces = new Set();
    pairs.forEach(([a, b], idx) => {
      if (idx > firstUse && idx < secondUse) {
        trappedPieces.add(cornerPieceOf[a]);
        trappedPieces.add(cornerPieceOf[b]);
      }
    });

    assert.ok(trappedPieces.has(cornerPieceOf[single]),
      `singiel ${single} (${cornerPieceOf[single]}) nie z uwięzionego kawałka. Powtórka: ${repeatKey} na ${firstUse + 1} i ${secondUse + 1}. Uwięzione: ${[...trappedPieces].join(", ")}`);
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=5 z singlem (4+1)");
});
test("singiel w displayPairs: po parach rogów, przed krawędziami", () => {
  for (let i = 0; i < 100; i++) {
    const s = generateSession("mixed", "?", 4);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    const types = s.displayPairs.map((p) => p.type);
    const singielIdx = types.indexOf("corner-single");
    const lastCornerIdx = types.lastIndexOf("corner");
    const firstEdgeIdx = types.indexOf("edge");
    assert.ok(lastCornerIdx === -1 || lastCornerIdx < singielIdx);
    assert.ok(firstEdgeIdx === -1 || singielIdx < firstEdgeIdx);
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

test("Tryb B corners 4 pary: 1 powtórka, ostatnia = zamknięcie", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("corners", 4, false);
    assert.strictEqual(countRepeats(pairs, pieceOfCorner), 1);
    const lastLetter = pairs[3][1];
    const usedBefore = new Set(pairs.slice(0, 3).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
    assert.ok(usedBefore.has(pieceOfCorner(lastLetter)), `${lastLetter} nie jest zamknięciem`);
  }
});
test("Tryb B corners 5 par: 3 powtórki, ostatnia = zamknięcie", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("corners", 5, false);
    assert.strictEqual(countRepeats(pairs, pieceOfCorner), 3);
    const lastLetter = pairs[4][1];
    const usedBefore = new Set(pairs.slice(0, 4).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)]));
    assert.ok(usedBefore.has(pieceOfCorner(lastLetter)), `${lastLetter} nie jest zamknięciem`);
  }
});
test("Tryb B edges 6 par: ostatnia = włamanie", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("edges", 6, false);
    const lastLetter = pairs[5][1];
    const usedBefore = new Set(pairs.slice(0, 5).flatMap(([a, b]) => [pieceOfEdge(a), pieceOfEdge(b)]));
    assert.ok(usedBefore.has(pieceOfEdge(lastLetter)), `${lastLetter} nie jest włamaniem`);
  }
});
test("Tryb B edges 7 par: ostatnia = włamanie", () => {
  for (let i = 0; i < 100; i++) {
    const pairs = generatePairsForType("edges", 7, false);
    const lastLetter = pairs[6][1];
    const usedBefore = new Set(pairs.slice(0, 6).flatMap(([a, b]) => [pieceOfEdge(a), pieceOfEdge(b)]));
    assert.ok(usedBefore.has(pieceOfEdge(lastLetter)), `${lastLetter} nie jest włamaniem`);
  }
});
test("generateSession edges 6-7: ostatnia = włamanie", () => {
  for (const ec of [6, 7]) {
    for (let i = 0; i < 30; i++) {
      const s = generateSession("edges", 2, ec);
      const edgePairs = s.displayPairs.filter((p) => p.type === "edge").map((p) => p.pair);
      const lastLetter = edgePairs[ec - 1][1];
      const usedBefore = new Set(edgePairs.slice(0, ec - 1).flatMap(([a, b]) => [pieceOfEdge(a), pieceOfEdge(b)]));
      assert.ok(usedBefore.has(pieceOfEdge(lastLetter)), `ec=${ec}: ${lastLetter} nie jest włamaniem`);
    }
  }
});
test("generateSession corners cc=4 bez singla: ostatnia = włamanie", () => {
  let tested = 0;
  for (let i = 0; i < 100 && tested < 30; i++) {
    const s = generateSession("corners", 4, 0);
    if (s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const cornerPairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const lastLetter = cornerPairs[3][1];
    const usedBefore = new Set(
      cornerPairs.slice(0, 3).flatMap(([a, b]) => [pieceOfCorner(a), pieceOfCorner(b)])
    );
    assert.ok(usedBefore.has(pieceOfCorner(lastLetter)),
      `ostatnia litera ${lastLetter} (klocek ${pieceOfCorner(lastLetter)}) nie jest włamaniem`);
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=4 bez singla");
});

// ─── cc=5 z singlem (4+1): tryb B z 2 powtórkami ─────────────────────────────
console.log("\ncc=5 z singlem (4+1): tryb B z 2 powtórkami");
test("cc=5 z singlem (4+1): dokładnie 1 powtórka w parach", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 5, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    assert.strictEqual(countRepeats(pairs, pieceOfCorner), 1, "powinna być 1 powtórka w parach");
  }
  assert.ok(tested > 0, "nie wygenerowano sesji cc=5 z singlem (4+1)");
});
test("cc=5 z singlem (4+1): powtórka w parze 2 lub 3", () => {
  let tested = 0;
  for (let i = 0; i < 200 && tested < 30; i++) {
    const s = generateSession("corners", 5, 0);
    if (!s.displayPairs.some((p) => p.type === "corner-single")) continue;
    tested++;
    const pairs = s.displayPairs.filter((p) => p.type === "corner").map((p) => p.pair);
    const pieceUses = new Map();
    let repeatPairIdx = -1;
    pairs.forEach(([a, b], idx) => {
      for (const p of [pieceOfCorner(a), pieceOfCorner(b)]) {
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

// ─── zasada kolejności ────────────────────────────────────────────────────────
console.log("\nzasada kolejności");
test("corners: kawałek 2. litery pary N ≠ kawałek 1. litery pary N+1", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [2, 3, 4, 5]) {
      const pairs = generatePairsForType("corners", n);
      for (let j = 0; j < pairs.length - 1; j++) {
        assert.notStrictEqual(cornerPieceOf[pairs[j][1]], cornerPieceOf[pairs[j + 1][0]],
          `n=${n}: para ${j}[1]='${pairs[j][1]}' i para ${j + 1}[0]='${pairs[j + 1][0]}' z tego samego kawałka`);
      }
    }
  }
});
test("edges: kawałek 2. litery pary N ≠ kawałek 1. litery pary N+1", () => {
  for (let i = 0; i < 50; i++) {
    for (const n of [4, 5, 6, 7]) {
      const pairs = generatePairsForType("edges", n);
      for (let j = 0; j < pairs.length - 1; j++) {
        assert.notStrictEqual(edgePieceOf[pairs[j][1]], edgePieceOf[pairs[j + 1][0]],
          `n=${n}: para ${j}[1]='${pairs[j][1]}' i para ${j + 1}[0]='${pairs[j + 1][0]}' z tego samego kawałka`);
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
    wingsPairs.flat().forEach((l) => letterCounts.set(l, (letterCounts.get(l) || 0) + 1));
    assert.strictEqual([...letterCounts.values()].filter((c) => c === 2).length, 1);
  }
});
test("wingsy 12 par: powtórka nie w tej samej parze", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("wings", 2, 12, 6);
    const wingsPairs = s.displayPairs.filter((p) => p.type === "wing").map((p) => p.pair);
    if (wingsPairs.length !== 12) continue;
    wingsPairs.forEach(([a, b], idx) =>
      assert.notStrictEqual(a, b, `para ${idx + 1}: ta sama litera ${a}`)
    );
  }
});
test("wingsy 12 par: powtórka nie w sąsiednich parach", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("wings", 2, 12, 6);
    const wingsPairs = s.displayPairs.filter((p) => p.type === "wing").map((p) => p.pair);
    if (wingsPairs.length !== 12) continue;
    const letterCounts = new Map();
    wingsPairs.flat().forEach((l) => letterCounts.set(l, (letterCounts.get(l) || 0) + 1));
    const repeatLetter = [...letterCounts.entries()].find(([, c]) => c === 2)?.[0];
    if (!repeatLetter) continue;
    const pairsWithRepeat = wingsPairs.map((p, i) => p.includes(repeatLetter) ? i : -1).filter(i => i >= 0);
    assert.ok(Math.abs(pairsWithRepeat[0] - pairsWithRepeat[1]) > 1,
      `powtórka w sąsiednich parach ${pairsWithRepeat[0] + 1} i ${pairsWithRepeat[1] + 1}`);
  }
});
test("wingsy 12 par: zasada kolejności", () => {
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

// ─── 4BLD centry (grupy) ──────────────────────────────────────────────────────
console.log("\n4BLD centry (grupy)");
const CENTERS_SCHEMA = [
  ["A", "B", "C"],
  ["D", "E", "F", "G"],
  ["H", "I", "J", "Ł"],
  ["K", "L", "M", "N"],
  ["O", "P", "R", "S"],
  ["T", "U", "W", "Z"],
];
function getCenterGroup(letter) {
  for (const g of CENTERS_SCHEMA) if (g.includes(letter)) return g;
  return null;
}

test("centry: każda litera max 1 raz w sesji", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("centers", 2, 11, 8);
    const centersPairs = s.displayPairs.filter((p) => p.type === "center" || p.type === "center-single").map((p) => p.pair);
    const allLetters = centersPairs.flat();
    assert.strictEqual(new Set(allLetters).size, allLetters.length, "duplikat litery");
  }
});

test("centry: litery w parze nie z tej samej grupy", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("centers", 2, 11, 8);
    const centersPairs = s.displayPairs.filter((p) => p.type === "center").map((p) => p.pair);
    centersPairs.forEach(([a, b], idx) => {
      const gA = getCenterGroup(a);
      const gB = getCenterGroup(b);
      assert.ok(!gA.includes(b), `para ${idx + 1}: ${a} i ${b} z tej samej grupy`);
    });
  }
});

test("centry: sąsiednie litery nie z tej samej grupy", () => {
  for (let i = 0; i < 30; i++) {
    const s = generate4BLDSession("centers", 2, 11, 8);
    const centersItems = s.displayPairs.filter((p) => p.type === "center" || p.type === "center-single");
    const allLetters = centersItems.flatMap((p) => p.pair);
    for (let j = 0; j < allLetters.length - 1; j++) {
      const g1 = getCenterGroup(allLetters[j]);
      const g2 = getCenterGroup(allLetters[j + 1]);
      assert.ok(g1 !== g2, `litery ${j}: ${allLetters[j]} i ${allLetters[j + 1]} z tej samej grupy`);
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

test("akceptuje poprawny schemat", () => assert.strictEqual(validateSchema(validCorners, validEdges), null));
test("odrzuca pusty schemat rogów", () => assert.ok(validateSchema([], validEdges) !== null));
test("odrzuca pusty schemat krawędzi", () => assert.ok(validateSchema(validCorners, []) !== null));
test("odrzuca niepełną grupę rogów", () => {
  const bad = validCorners.map(g => [...g]); bad[2][1] = "";
  assert.ok(validateSchema(bad, validEdges)?.includes("rogów 3"));
});
test("odrzuca niepełną grupę krawędzi", () => {
  const bad = validEdges.map(g => [...g]); bad[5][0] = "";
  assert.ok(validateSchema(validCorners, bad)?.includes("krawędzi 6"));
});
test("odrzuca duplikat w rogach", () => {
  const bad = validCorners.map(g => [...g]); bad[0][1] = "A";
  assert.ok(validateSchema(bad, validEdges)?.includes("Powtórzona"));
});
test("odrzuca duplikat między grupami rogów", () => {
  const bad = validCorners.map(g => [...g]); bad[3][0] = "A";
  assert.ok(validateSchema(bad, validEdges)?.includes("Powtórzona"));
});
test("odrzuca duplikat między grupami krawędzi", () => {
  const bad = validEdges.map(g => [...g]); bad[7][0] = "A";
  assert.ok(validateSchema(validCorners, bad)?.includes("Powtórzona"));
});
test("akceptuje Ł jako literę", () => {
  const corners = validCorners.map(g => [...g]); corners[6][2] = "Ł";
  assert.strictEqual(validateSchema(corners, validEdges), null);
});

// ─── validateSchema4BLD ───────────────────────────────────────────────────────
console.log("\nvalidateSchema4BLD");
const validWings = "ABCDEFGHIKLMNOPRSTUWXZŁ".split("").map(l => [l]);
const validCenters = [
  ["A", "B", "C"],
  ["D", "E", "F", "G"],
  ["H", "I", "K", "L"],
  ["M", "N", "O", "P"],
  ["R", "S", "T", "U"],
  ["W", "X", "Z", "Ł"],
];

test("akceptuje poprawny schemat 4BLD", () => assert.strictEqual(validateSchema4BLD(validCorners, validWings, validCenters), null));
test("odrzuca niepełne wingsy", () => assert.ok(validateSchema4BLD(validCorners, validWings.slice(0, 20), validCenters)?.includes("wingsów")));
test("odrzuca niepełne centry", () => assert.ok(validateSchema4BLD(validCorners, validWings, validCenters.slice(0, 3))?.includes("centrów")));
test("odrzuca duplikat w wingsach", () => {
  const bad = validWings.map(g => [...g]); bad[10][0] = "A";
  assert.ok(validateSchema4BLD(validCorners, bad, validCenters)?.includes("wingsach"));
});
test("odrzuca duplikat w centrach", () => {
  const bad = validCenters.map(g => [...g]); bad[5][0] = "A";
  assert.ok(validateSchema4BLD(validCorners, validWings, bad)?.includes("centrów"));
});

// ─── 4BLD kolejność ───────────────────────────────────────────────────────────
console.log("\n4BLD kolejność");
test("4BLD displayPairs: centry → wingsy → rogi", () => {
  const s = generate4BLDSession("mixed", 3, 11, 7);
  const types = s.displayPairs.map((p) => p.type.replace("-single", ""));
  const lastCenter = Math.max(...types.map((t, i) => t === "center" ? i : -1));
  const firstWing = types.indexOf("wing");
  const lastWing = Math.max(...types.map((t, i) => t === "wing" ? i : -1));
  const firstCorner = types.indexOf("corner");
  assert.ok(lastCenter < firstWing, "centry przed wingsami");
  assert.ok(lastWing < firstCorner, "wingsy przed rogami");
});
test("4BLD answerPairs: centry → wingsy → rogi", () => {
  const s = generate4BLDSession("mixed", 3, 11, 7);
  const types = s.answerPairs.map((p) => p.type.replace("-single", ""));
  const lastCenter = Math.max(...types.map((t, i) => t === "center" ? i : -1));
  const firstWing = types.indexOf("wing");
  const lastWing = Math.max(...types.map((t, i) => t === "wing" ? i : -1));
  const firstCorner = types.indexOf("corner");
  assert.ok(lastCenter < firstWing, "centry przed wingsami");
  assert.ok(lastWing < firstCorner, "wingsy przed rogami");
});
test("4BLD displayPairs === answerPairs kolejność", () => {
  const s = generate4BLDSession("mixed", 3, 11, 7);
  const dTypes = s.displayPairs.map((p) => p.type);
  const aTypes = s.answerPairs.map((p) => p.type);
  assert.deepStrictEqual(dTypes, aTypes);
});

// ─── 5BLD kolejność ───────────────────────────────────────────────────────────
console.log("\n5BLD kolejność");
test("5BLD displayPairs: x-centry → t-centry → midges → wingsy → rogi", () => {
  const s = generate5BLDSession("mixed", 3, 11, 5, 8, 8);
  const types = s.displayPairs.map((p) => p.type.replace("-single", ""));
  const lastXcenter = Math.max(...types.map((t, i) => t === "xcenter" ? i : -1));
  const firstTcenter = types.indexOf("tcenter");
  const lastTcenter = Math.max(...types.map((t, i) => t === "tcenter" ? i : -1));
  const firstMidge = types.indexOf("midge");
  const lastMidge = Math.max(...types.map((t, i) => t === "midge" ? i : -1));
  const firstWing = types.indexOf("wing");
  const lastWing = Math.max(...types.map((t, i) => t === "wing" ? i : -1));
  const firstCorner = types.indexOf("corner");
  assert.ok(lastXcenter < firstTcenter, "x-centry przed t-centrami");
  assert.ok(lastTcenter < firstMidge, "t-centry przed midges");
  assert.ok(lastMidge < firstWing, "midges przed wingsami");
  assert.ok(lastWing < firstCorner, "wingsy przed rogami");
});
test("5BLD answerPairs: x-centry → t-centry → midges → wingsy → rogi", () => {
  const s = generate5BLDSession("mixed", 3, 11, 5, 8, 8);
  const types = s.answerPairs.map((p) => p.type.replace("-single", ""));
  const lastXcenter = Math.max(...types.map((t, i) => t === "xcenter" ? i : -1));
  const firstTcenter = types.indexOf("tcenter");
  const lastTcenter = Math.max(...types.map((t, i) => t === "tcenter" ? i : -1));
  const firstMidge = types.indexOf("midge");
  const lastMidge = Math.max(...types.map((t, i) => t === "midge" ? i : -1));
  const firstWing = types.indexOf("wing");
  const lastWing = Math.max(...types.map((t, i) => t === "wing" ? i : -1));
  const firstCorner = types.indexOf("corner");
  assert.ok(lastXcenter < firstTcenter, "x-centry przed t-centrami");
  assert.ok(lastTcenter < firstMidge, "t-centry przed midges");
  assert.ok(lastMidge < firstWing, "midges przed wingsami");
  assert.ok(lastWing < firstCorner, "wingsy przed rogami");
});
test("5BLD displayPairs === answerPairs kolejność", () => {
  const s = generate5BLDSession("mixed", 3, 11, 5, 8, 8);
  const dTypes = s.displayPairs.map((p) => p.type);
  const aTypes = s.answerPairs.map((p) => p.type);
  assert.deepStrictEqual(dTypes, aTypes);
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
