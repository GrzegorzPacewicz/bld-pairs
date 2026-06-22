import {
  CORNERS,
  EDGES,
  CORNER_VARIANTS,
  EDGE_WEIGHTS,
  EDGE_VARIANTS_3OP,
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
        // Fallback: gdy singiel się nie uda, wygeneruj pełny zestaw par
        return {
          pairs: generatePairsForType("corners", pairCount + 1, modeA),
          singiel: null,
        };
      }
    } else {
      // Znajdź kawałek powtórzony i jego pozycje
      let repeatPieceKey = null;
      let firstUse = -1;
      let secondUse = -1;
      for (const g of schema) {
        const key = g.join("");
        const positions = [];
        pairs.forEach(([a, b], idx) => {
          if (g.includes(a) || g.includes(b)) positions.push(idx);
        });
        if (positions.length === 2) {
          repeatPieceKey = key;
          firstUse = positions[0];
          secondUse = positions[1];
          break;
        }
      }
      if (repeatPieceKey === null) {
        // Fallback: gdy singiel się nie uda, wygeneruj pełny zestaw par
        return { pairs: generatePairsForType("corners", pairCount + 1, false), singiel: null };
      }
      const trappedPieces = schema.filter((g) => {
        const key = g.join("");
        if (key === repeatPieceKey) return false;
        return pairs.some(([a, b], idx) => {
          if (idx <= firstUse || idx >= secondUse) return false;
          return g.includes(a) || g.includes(b);
        });
      });
      const candidates = trappedPieces
        .flatMap((g) => g)
        .filter((l) => l !== lastLetter);
      if (candidates.length > 0) {
        singiel = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        // Fallback: gdy singiel się nie uda, wygeneruj pełny zestaw par
        return { pairs: generatePairsForType("corners", pairCount + 1, false), singiel: null };
      }
    }
  }

  return { pairs, singiel };
}

// =============================================================================
// SEKCJA 2: GENEROWANIE KRAWĘDZI
// =============================================================================
//
// 3Style: krawędzie parzyste (bez singla)
// 3OP: krawędzie mogą mieć singiel (5+1, 6+1)
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
// SEKCJA 2b: GENEROWANIE KRAWĘDZI 3OP (z singlem)
// =============================================================================
//
// 5+1: 5 par + singiel = 11 liter, tryb A (bez powtórek)
// 6+1: 6 par + singiel = 13 liter, 2 powtórki
//
function generateEdges3OP(variant) {
  const { pairs: pairCount, singiel: hasSingiel } = variant;

  if (!hasSingiel) {
    return { pairs: generateEdges(pairCount), singiel: null };
  }

  if (pairCount === 5) {
    // 5+1: tryb A, singiel z nieużytego kawałka
    const pairs = generatePairsForType("edges", 5, true);
    const usedPieces = new Set();
    pairs.forEach(([a, b]) => {
      for (const g of EDGES) {
        if (g.includes(a)) usedPieces.add(g.join(""));
        if (g.includes(b)) usedPieces.add(g.join(""));
      }
    });
    const unusedPieces = EDGES.filter((g) => !usedPieces.has(g.join("")));
    if (unusedPieces.length > 0) {
      const piece = unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
      const singiel = piece[Math.floor(Math.random() * piece.length)];
      return { pairs, singiel };
    }
    return { pairs, singiel: null };
  }

  if (pairCount === 6) {
    // 6+1: 6 par (1 kawałek użyty 2x) + singiel
    // Wzór: ab cd ef ga hijk h (każda litera = kawałek)
    return generateEdges6Plus1();
  }

  return { pairs: generateEdges(pairCount), singiel: null };
}

// Generuje 6+1: 6 par (z 1 powtórką kawałka) + singiel z dowolnego użytego kawałka
// Wzór: ab cd ef ga hijk h (gdzie każda litera = kawałek)
// - 11 kawałków, 6 par = 12 użyć → 1 kawałek użyty 2x
// - singiel: nieużyta litera z dowolnego kawałka który był w parach
function generateEdges6Plus1() {
  const pairs = generatePairsForType("edges", 6, false);

  // Znajdź kawałki użyte w parach
  const usedLetters = new Set();
  const usedPieces = new Set();
  pairs.forEach(([a, b]) => {
    usedLetters.add(a);
    usedLetters.add(b);
    for (const g of EDGES) {
      if (g.includes(a)) usedPieces.add(g.join(""));
      if (g.includes(b)) usedPieces.add(g.join(""));
    }
  });

  // Singiel: nieużyta litera z kawałka który był użyty
  const lastLetter = pairs[pairs.length - 1][1];
  const singielCandidates = [];
  for (const key of usedPieces) {
    const group = EDGES.find((g) => g.join("") === key);
    for (const l of group) {
      if (!usedLetters.has(l) && l !== lastLetter) {
        singielCandidates.push(l);
      }
    }
  }

  if (singielCandidates.length === 0) {
    return { pairs, singiel: null };
  }

  const singiel = singielCandidates[Math.floor(Math.random() * singielCandidates.length)];
  return { pairs, singiel };
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
//   is3OP       — true dla trybu 3OP (synchronizacja parzystości rogów i krawędzi)
//
// UI przekazuje liczbę par (2/3/4/5), generator losuje 50/50 czy będzie singiel.
// Przy "?" losuje z pełnych wag CORNER_VARIANTS.
//
export function generateSession(mode, cornerCount, edgeCount, is3OP = false) {
  let variant;
  if (cornerCount === "?") {
    variant = weightedRandomVariant(CORNER_VARIANTS);
  } else {
    const cc = typeof cornerCount === "string" ? parseInt(cornerCount) : cornerCount;
    const withSingiel = Math.random() < 0.5;
    // UI "Nc" = N elementów: albo N par, albo (N-1) par + singiel
    const variantName = withSingiel && cc >= 3 ? `${cc - 1}+1` : String(cc);
    variant = CORNER_VARIANTS.find((v) => v.variant === variantName);
    if (!variant) {
      variant = CORNER_VARIANTS.find((v) => v.variant === String(cc)) || CORNER_VARIANTS[2];
    }
  }

  let cornerPairs = [];
  let cornerSingiel = null;

  if (mode === "corners" || mode === "mixed") {
    const result = generateCorners(CORNERS, variant);
    cornerPairs = result.pairs;
    cornerSingiel = result.singiel;
  }

  let edgePairs = [];
  let edgeSingiel = null;

  if (mode === "edges" || mode === "mixed") {
    if (is3OP) {
      // 3OP: synchronizacja parzystości
      // mixed: krawędzie dopasowane do rzeczywistego wyniku rogów (cornerSingiel !== null)
      // edges only: losowe 50/50
      const needOddEdges = mode === "mixed" ? (cornerSingiel !== null) : Math.random() < 0.5;

      let edgeVariant;
      if (edgeCount === "?") {
        // Losuj z odpowiednich wariantów
        const candidates = EDGE_VARIANTS_3OP.filter((v) => v.singiel === needOddEdges);
        edgeVariant = weightedRandomVariant(candidates);
      } else {
        const ec = typeof edgeCount === "string" ? parseInt(edgeCount) : edgeCount;
        const variantName = needOddEdges ? `${ec}+1` : String(ec);
        edgeVariant = EDGE_VARIANTS_3OP.find((v) => v.variant === variantName);
        if (!edgeVariant) {
          edgeVariant = EDGE_VARIANTS_3OP.find((v) => v.variant === String(ec)) || EDGE_VARIANTS_3OP[1];
        }
      }

      const result = generateEdges3OP(edgeVariant);
      edgePairs = result.pairs;
      edgeSingiel = result.singiel;
    } else {
      // 3Style: krawędzie bez singla
      const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;
      edgePairs = generateEdges(ec);
    }
  }

  const cornerItems = [
    ...cornerPairs.map((p) => ({ pair: p, type: "corner" })),
    ...(cornerSingiel
      ? [{ pair: [cornerSingiel], type: "corner-single" }]
      : []),
  ];

  const edgeItems = [
    ...edgePairs.map((p) => ({ pair: p, type: "edge" })),
    ...(edgeSingiel
      ? [{ pair: [edgeSingiel], type: "edge-single" }]
      : []),
  ];

  return {
    displayPairs: [
      ...cornerItems,
      ...edgeItems,
    ],
    answerPairs: [
      ...edgeItems,
      ...cornerItems,
    ],
  };
}
