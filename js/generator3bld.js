import {
  CORNERS,
  EDGES,
  CORNER_VARIANTS,
  EDGE_WEIGHTS,
  weightedRandom,
  weightedRandomVariant,
} from "./schema.js";
import { generatePairsForType } from "./generator.js";

// =============================================================================
// SEKCJA 1: GENEROWANIE ROGÓW
// =============================================================================
//
// generateCorners(schema, variant) — wspólna funkcja dla 3BLD i 4BLD
// variant: obiekt { variant, pairs, singiel, weight } z CORNER_VARIANTS
//
// Tryb A (bez powtórek): 2, 2+1, 3, 3+1
// Tryb B (z powtórkami): 4 (1 powtórka), 4+1 (2 powtórki), 5 (3 powtórki)
//
export function generateCorners(schema, variant) {
  const { pairs: pairCount, singiel: hasSingiel, variant: variantName } = variant;

  // Effective count: singiel zmniejsza liczbę par o 1
  const effectiveCount = hasSingiel ? pairCount : pairCount;

  // Tryb zależy od wariantu
  const modeA = ["2", "2+1", "3", "3+1"].includes(variantName);

  let pairs;
  if (variantName === "4+1") {
    // Tryb 4+1: 2 powtórki, specjalna obsługa
    pairs = generatePairsForType("corners", effectiveCount, false, {
      targetRepeats: 2,
      is4Plus1: true,
    });
  } else {
    pairs = generatePairsForType("corners", effectiveCount, modeA);
  }

  let singiel = null;

  if (hasSingiel) {
    const usedPieces = new Set();
    pairs.forEach(([a, b]) => {
      for (const g of schema) {
        if (g.includes(a)) usedPieces.add(g.join(""));
        if (g.includes(b)) usedPieces.add(g.join(""));
      }
    });

    const lastLetter = pairs.length > 0 ? pairs[pairs.length - 1][1] : null;

    if (modeA) {
      // Tryb A: singiel z nieużytego kawałka
      const unusedPieces = schema.filter((g) => !usedPieces.has(g.join("")));
      if (unusedPieces.length > 0) {
        const piece =
          unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
        singiel = piece[Math.floor(Math.random() * piece.length)];
      } else {
        // Fallback: wygeneruj pełny zestaw bez singla
        return {
          pairs: generatePairsForType("corners", pairCount, modeA),
          singiel: null,
        };
      }
    } else {
      // Tryb B (4+1): singiel z kawałka otwartego przez powtórkę 1
      // Szukamy kawałka który został użyty tylko raz (otwarty cykl)
      const openPieces = schema.filter((g) => {
        const key = g.join("");
        if (!usedPieces.has(key)) return false;
        // Sprawdź czy kawałek użyty tylko raz (otwarty)
        let count = 0;
        for (const [a, b] of pairs) {
          if (g.includes(a)) count++;
          if (g.includes(b)) count++;
        }
        return count === 1;
      });

      const candidates = openPieces
        .flatMap((g) => g)
        .filter((l) => l !== lastLetter);

      if (candidates.length > 0) {
        singiel = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        return {
          pairs: generatePairsForType("corners", pairCount, false, {
            targetRepeats: 2,
            is4Plus1: true,
          }),
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
// UI przekazuje liczbę par (2/3/4/5), generator losuje 50/50 czy będzie singiel.
// Przy "?" losuje z pełnych wag CORNER_VARIANTS.
//
export function generateSession(mode, cornerCount, edgeCount) {
  let variant;
  if (cornerCount === "?") {
    variant = weightedRandomVariant(CORNER_VARIANTS);
  } else {
    const cc = typeof cornerCount === "string" ? parseInt(cornerCount) : cornerCount;
    const withSingiel = Math.random() < 0.5;
    const variantName = withSingiel && cc <= 4 ? `${cc}+1` : String(cc);
    variant = CORNER_VARIANTS.find((v) => v.variant === variantName);
    if (!variant) {
      variant = CORNER_VARIANTS.find((v) => v.variant === String(cc)) || CORNER_VARIANTS[2];
    }
  }

  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;

  let cornerPairs = [];
  let cornerSingiel = null;

  if (mode === "corners" || mode === "mixed") {
    const result = generateCorners(CORNERS, variant);
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
