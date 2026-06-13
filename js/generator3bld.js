import {
  CORNERS,
  EDGES,
  CORNER_WEIGHTS,
  EDGE_WEIGHTS,
  weightedRandom,
} from "./schema.js";
import { generatePairsForType } from "./generator.js";

export function generateSession(mode, cornerCount, edgeCount) {
  const cc = cornerCount === "?" ? weightedRandom(CORNER_WEIGHTS) : cornerCount;
  const ec = edgeCount === "?" ? weightedRandom(EDGE_WEIGHTS) : edgeCount;

  const willHaveSingiel =
    (mode === "corners" || mode === "mixed") && Math.random() < 0.5;

  let cornerPairs = [];
  let cornerSingiel = null;

  if (mode === "corners" || mode === "mixed") {
    const effectiveCc = willHaveSingiel ? cc - 1 : cc;
    const cornerModeA = effectiveCc <= 3;
    cornerPairs = generatePairsForType("corners", effectiveCc, cornerModeA);

    if (willHaveSingiel) {
      const usedPieces = new Set();
      const pieceUseCount = new Map();

      cornerPairs.forEach(([a, b]) => {
        for (const g of CORNERS) {
          const key = g.join("");
          if (g.includes(a)) {
            usedPieces.add(key);
            pieceUseCount.set(key, (pieceUseCount.get(key) || 0) + 1);
          }
          if (g.includes(b)) {
            usedPieces.add(key);
            pieceUseCount.set(key, (pieceUseCount.get(key) || 0) + 1);
          }
        }
      });

      if (!cornerModeA) {
        // Tryb B: singiel tylko z kawałków użytych dwukrotnie (włamanie)
        const repeatPieces = CORNERS.filter(
          (g) => (pieceUseCount.get(g.join("")) || 0) >= 2,
        );
        const lastLetter =
          cornerPairs.length > 0
            ? cornerPairs[cornerPairs.length - 1][1]
            : null;
        const candidates = repeatPieces
          .flatMap((g) => g)
          .filter((l) => l !== lastLetter);
        if (candidates.length > 0) {
          cornerSingiel =
            candidates[Math.floor(Math.random() * candidates.length)];
        } else {
          cornerPairs = generatePairsForType("corners", cc, cornerModeA);
        }
      } else {
        // Tryb A: singiel z kawałka który nie wystąpił w żadnej parze
        const unusedPieces = CORNERS.filter((g) => !usedPieces.has(g.join("")));
        if (unusedPieces.length > 0) {
          const piece =
            unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
          cornerSingiel = piece[Math.floor(Math.random() * piece.length)];
        } else {
          cornerPairs = generatePairsForType("corners", cc, cornerModeA);
        }
      }
    }
  }

  let edgePairs = [];
  if (mode === "edges" || mode === "mixed") {
    const edgeModeA = ec <= 5;
    if (ec === 6 && !edgeModeA) {
      const variant = Math.random() < 0.5 ? "A" : "B";
      const skipPiece =
        variant === "B" ? Math.floor(Math.random() * EDGES.length) : undefined;
      edgePairs = generatePairsForType("edges", ec, false, {
        edgeVariant: variant,
        skipPiece,
      });
    } else {
      edgePairs = generatePairsForType("edges", ec, edgeModeA);
    }
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
