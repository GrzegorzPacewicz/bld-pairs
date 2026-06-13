import {
  CORNERS,
  EDGES,
  CORNER_WEIGHTS,
  EDGE_WEIGHTS,
  weightedRandom,
} from "./schema.js";
import { generatePairsForType } from "./generator.js";

// =============================================================================
// SEKCJA 1: GENEROWANIE ROGÓW
// =============================================================================
//
// Singiel zmniejsza effectiveCc o 1, żeby łączna liczba liter była nieparzysta
// (wymaganie BLD: jedna litera bez pary to buffer).
//
// Tryb B wymaga singla z kawałka już użytego — musi być częścią otwartego cyklu.
// Tryb A wymaga singla z kawałka nieużytego — nie ma cykli do zamknięcia.
//
function generateCorners(cc, willHaveSingiel) {
  const effectiveCc = willHaveSingiel ? cc - 1 : cc;
  const modeA = effectiveCc <= 3;
  const pairs = generatePairsForType("corners", effectiveCc, modeA);

  let singiel = null;

  if (willHaveSingiel) {
    const usedPieces = new Set();
    pairs.forEach(([a, b]) => {
      for (const g of CORNERS) {
        if (g.includes(a)) usedPieces.add(g.join(""));
        if (g.includes(b)) usedPieces.add(g.join(""));
      }
    });

    const lastLetter = pairs.length > 0 ? pairs[pairs.length - 1][1] : null;

    if (modeA) {
      const unusedPieces = CORNERS.filter((g) => !usedPieces.has(g.join("")));
      if (unusedPieces.length > 0) {
        const piece =
          unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
        singiel = piece[Math.floor(Math.random() * piece.length)];
      } else {
        // Fallback: wygeneruj pełny zestaw bez singla
        return {
          pairs: generatePairsForType("corners", cc, modeA),
          singiel: null,
        };
      }
    } else {
      // Ostatnia litera jest wykluczona — singiel nie może łamać zasady kolejności
      const candidates = CORNERS.filter((g) => usedPieces.has(g.join("")))
        .flatMap((g) => g)
        .filter((l) => l !== lastLetter);
      if (candidates.length > 0) {
        singiel = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        return {
          pairs: generatePairsForType("corners", cc, modeA),
          singiel: null,
        };
      }
    }
  }

  return { pairs, singiel };
}

// =============================================================================
// SEKCJA 2: GENEROWANIE KRAWĘDZI
// =============================================================================
//
// Krawędzie nie mają singla — liczba liter musi być parzysta (parzystość permutacji).
//
// Wariant B przy 6 parach pomija jeden kawałek zamiast go powtarzać,
// bo obie opcje są matematycznie równoważne dla solvera.
//
function generateEdges(ec) {
  const modeA = ec <= 5;

  if (ec === 6 && !modeA) {
    const variant = Math.random() < 0.5 ? "A" : "B";
    const skipPiece =
      variant === "B" ? Math.floor(Math.random() * EDGES.length) : undefined;
    return generatePairsForType("edges", ec, false, {
      edgeVariant: variant,
      skipPiece,
    });
  }

  return generatePairsForType("edges", ec, modeA);
}

// =============================================================================
// SEKCJA 3: EKSPORT — generateSession
// =============================================================================
//
// Kolejność wyświetlania i odpowiadania jest odwrócona — standard BLD:
// zapamiętuje się rogi przed krawędziami, odpowiada odwrotnie.
//
// Parametry:
//   mode        — "corners" | "edges" | "mixed"
//   cornerCount — 2|3|4|5|"?" (losowe z wagami)
//   edgeCount   — 4|5|6|7|"?" (losowe z wagami)
//
export function generateSession(mode, cornerCount, edgeCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;

  const willHaveSingiel =
    (mode === "corners" || mode === "mixed") && Math.random() < 0.5;

  let cornerPairs = [];
  let cornerSingiel = null;

  if (mode === "corners" || mode === "mixed") {
    const result = generateCorners(cc, willHaveSingiel);
    cornerPairs = result.pairs;
    cornerSingiel = result.singiel;
  }

  let edgePairs = [];
  if (mode === "edges" || mode === "mixed") {
    edgePairs = generateEdges(ec);
  }

  const cornerItems = [
    ...cornerPairs.map((p) => ({ pair: p, type: "corner" })),
    ...(cornerSingiel
      ? [{ pair: [cornerSingiel], type: "corner-single" }]
      : []),
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
