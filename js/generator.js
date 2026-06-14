import {
  CORNERS,
  EDGES,
  CORNERS_4BLD,
  shuffle,
  getBlockedLetters,
} from "./schema.js";

// =============================================================================
// SEKCJA 1: KONFIGURACJA
// =============================================================================
//
// Tryb A (bez powtórek):
//   - rogi:      count <= 3
//   - krawędzie: count <= 5
//
// Tryb B (z powtórkami):
//   - rogi 4 pary:         targetRepeats=1, blockingLimit=2
//   - rogi 4+1:            targetRepeats=2, blockingLimit=2, is4Plus1=true
//   - rogi 5 par:          osobny silnik (tryGen5CornerPairs), targetRepeats=3
//   - krawędzie 6 par A:   targetRepeats=1, blockingLimit=2
//   - krawędzie 6 par B:   targetRepeats=2, blockingLimit=2
//   - krawędzie 7 par:     targetRepeats=3, blockingLimit=2
//
// blockingLimit — ile pierwszych par stosuje blokadę grupową
// targetRepeats — ile kawałków może być użytych dwukrotnie w sesji
//
// Tryb 4+1 (is4Plus1=true):
//   - 4 pary + singiel z otwartego kawałka
//   - Powtórka 1 może wystąpić na pozycjach:
//     * para 2, miejsce 1 lub 2
//     * para 3, miejsce 1 (tylko — miejsce 2 wykluczone bo nie ma miejsca na zamknięcie)
//   - Powtórka 2 = singiel (zamknięcie otwartego cyklu)

// =============================================================================
// SEKCJA 2: SILNIK ROGÓW — 5 PAR
// =============================================================================
//
// 3 powtórki wymagają ściśle określonej kolejności par, której ogólny silnik
// nie potrafi wymusić — stąd osobna funkcja ze stałą sekwencją wywołań makePair.
//
function tryGen5CornerPairs(schema) {
  const pairs = [];
  const pieceUses = new Map(schema.map((g) => [g.join(""), 0]));
  const loopBlocked = new Set();
  const usedPairs = new Set();

  const getAvailableLetters = (excludePieceKey = null) => {
    const letters = [];
    for (const group of schema) {
      const key = group.join("");
      if (pieceUses.get(key) >= 2) continue;
      if (key === excludePieceKey) continue;
      for (const letter of group) {
        if (loopBlocked.has(letter)) continue;
        letters.push({
          letter,
          pieceKey: key,
          isRepeat: pieceUses.get(key) === 1,
        });
      }
    }
    return letters;
  };

  const makePair = (firstMustRepeat, secondMustRepeat, prevPieceKey) => {
    let availFirst = getAvailableLetters(prevPieceKey);
    if (firstMustRepeat === true)
      availFirst = availFirst.filter((x) => x.isRepeat);
    if (firstMustRepeat === false)
      availFirst = availFirst.filter((x) => !x.isRepeat);

    availFirst = shuffle(availFirst);

    for (const first of availFirst) {
      let availSecond = getAvailableLetters(first.pieceKey);
      if (secondMustRepeat === true)
        availSecond = availSecond.filter((x) => x.isRepeat);
      if (secondMustRepeat === false)
        availSecond = availSecond.filter((x) => !x.isRepeat);

      // Dwie powtórki w jednej parze złamałyby logikę cyklu
      if (first.isRepeat) availSecond = availSecond.filter((x) => !x.isRepeat);

      availSecond = availSecond.filter((x) => {
        const pk = [first.letter, x.letter].sort().join("-");
        return !usedPairs.has(pk);
      });

      if (availSecond.length === 0) continue;

      const second =
        availSecond[Math.floor(Math.random() * availSecond.length)];

      const firstWillClose = pieceUses.get(first.pieceKey) === 1;
      const secondWillClose = pieceUses.get(second.pieceKey) === 1;

      // Blokada pętli musi być ustawiona przed zapisem pary,
      // żeby nie zablokować kawałka który właśnie zamykamy
      if (firstWillClose) {
        for (const [key, uses] of pieceUses) {
          if (uses === 1 && key !== first.pieceKey && key !== second.pieceKey) {
            schema
              .find((g) => g.join("") === key)
              ?.forEach((l) => loopBlocked.add(l));
          }
        }
      }

      pairs.push([first.letter, second.letter]);
      usedPairs.add([first.letter, second.letter].sort().join("-"));
      pieceUses.set(first.pieceKey, pieceUses.get(first.pieceKey) + 1);
      pieceUses.set(second.pieceKey, pieceUses.get(second.pieceKey) + 1);

      if (secondWillClose) {
        for (const [key, uses] of pieceUses) {
          if (uses === 1 && key !== second.pieceKey) {
            schema
              .find((g) => g.join("") === key)
              ?.forEach((l) => loopBlocked.add(l));
          }
        }
      }

      return second.pieceKey;
    }
    return null;
  };

  // Stała sekwencja: nowy+nowy, powt+nowy, nowy+nowy, powt+nowy, nowy+powt
  let prevPiece = null;
  prevPiece = makePair(false, false, null);
  if (!prevPiece) return null;
  prevPiece = makePair(true, false, prevPiece);
  if (!prevPiece) return null;
  prevPiece = makePair(false, false, prevPiece);
  if (!prevPiece) return null;
  prevPiece = makePair(true, false, prevPiece);
  if (!prevPiece) return null;
  prevPiece = makePair(false, true, prevPiece);
  if (!prevPiece) return null;

  return pairs;
}

// =============================================================================
// SEKCJA 3: GŁÓWNY SILNIK PAR
// =============================================================================
//
// Obsługuje Tryb A i Tryb B dla rogów (≤4 pary) i krawędzi.
// Działa metodą prób i błędów — przy ślepym zaułku zwraca null,
// a wywołujący ponawia próbę z nowym losowaniem.
//
function tryGenPairs(schema, count, config) {
  const { blockingLimit, targetRepeats, skipPiece, is4Plus1 } = config;

  const pairs = [];
  const pieceState = new Map(
    schema.map((g, idx) => [
      g.join(""),
      { uses: 0, firstUsedAt: -1, index: idx },
    ]),
  );
  const groupBlocked = new Set();
  const loopBlocked = new Set();
  let repeatsUsed = 0;

  // Krawędzie wariant B: jeden kawałek celowo pomijany dla zachowania parzystości
  if (skipPiece !== undefined && skipPiece >= 0 && skipPiece < schema.length) {
    schema[skipPiece].forEach((l) => groupBlocked.add(l));
  }

  let attempts = 0;
  while (pairs.length < count && attempts < 1000) {
    attempts++;

    const prevSecondLetter =
      pairs.length > 0 ? pairs[pairs.length - 1][1] : null;
    const prevSecondPiece = prevSecondLetter
      ? schema.find((g) => g.includes(prevSecondLetter))?.join("")
      : null;
    const isLastPair = pairs.length === count - 1;
    const applyBlock = pairs.length < blockingLimit;

    const avail = [];
    for (const group of schema) {
      const key = group.join("");
      const ps = pieceState.get(key);
      if (ps.uses >= 2) continue;
      for (const letter of group) {
        if (applyBlock && groupBlocked.has(letter)) continue;
        if (loopBlocked.has(letter)) continue;
        avail.push({
          letter,
          pieceKey: key,
          isRepeat: ps.uses >= 1,
          firstUsedAt: ps.firstUsedAt,
        });
      }
    }

    // Zasada kolejności: 1. litera nie może być z kawałka 2. litery poprzedniej pary
    let availFirst = shuffle(
      avail.filter((x) => x.pieceKey !== prevSecondPiece),
    );
    if (availFirst.length === 0) return null;

    let placed = false;

    for (const first of availFirst) {
      let candidates = avail.filter((x) => {
        if (x.pieceKey === first.pieceKey) return false;
        const pk = [first.letter, x.letter].sort().join("-");
        if (pairs.some(([a, b]) => [a, b].sort().join("-") === pk))
          return false;
        // Dwie powtórki w jednej parze złamałyby logikę cyklu
        if (first.isRepeat && x.isRepeat) return false;
        return true;
      });

      if (targetRepeats >= 1) {
        if (is4Plus1) {
          // Tryb 4+1: dokładnie 1 powtórka w parach, singiel będzie drugą
          // Pozycje powtórki 1: para 2 (miejsce 1/2) lub para 3 (miejsce 1)
          const pairIdx = pairs.length; // 0-indexed

          if (pairIdx === 0) {
            // Para 1: tylko nowe kawałki
            if (first.isRepeat) continue;
            candidates = candidates.filter((x) => !x.isRepeat);
          } else if (pairIdx === 1) {
            // Para 2: może być powtórka na miejscu 1 lub 2 (ale max 1)
            if (repeatsUsed >= 1) {
              // Już mamy powtórkę — same nowe
              if (first.isRepeat) continue;
              candidates = candidates.filter((x) => !x.isRepeat);
            }
            // Jeśli repeatsUsed === 0, dozwolone obie opcje (nowy lub powtórka)
          } else if (pairIdx === 2) {
            // Para 3: powtórka tylko na miejscu 1
            if (repeatsUsed >= 1) {
              // Już mamy powtórkę — same nowe
              if (first.isRepeat) continue;
              candidates = candidates.filter((x) => !x.isRepeat);
            } else {
              // Nie mamy jeszcze powtórki — musi być na miejscu 1 (first)
              // lub musimy ją mieć w parze 2 (ale skoro jesteśmy tu, znaczy że nie)
              // Powtórka może być na first, ale nie na second
              candidates = candidates.filter((x) => !x.isRepeat);
            }
          } else {
            // Para 4: tylko nowe (singiel zamknie cykl)
            if (first.isRepeat) continue;
            candidates = candidates.filter((x) => !x.isRepeat);
          }

          // Globalny limit: max 1 powtórka w parach (druga będzie singlem)
          candidates = candidates.filter((x) => {
            const wouldAdd = (first.isRepeat ? 1 : 0) + (x.isRepeat ? 1 : 0);
            return repeatsUsed + wouldAdd <= 1;
          });
        } else {
          // Standardowa logika dla innych trybów
          const maxRepeatsBeforeLastPair = targetRepeats - 1;
          const repeatsAvailableBeforeLastPair =
            maxRepeatsBeforeLastPair - repeatsUsed;
          const pairsBeforeLastPair = count - pairs.length - 1;
          const maxPossibleRepeats = pairsBeforeLastPair * 2;

          if (isLastPair) {
            // Ostatnia para zawsze zamyka cykl: first nowy, second powtórka
            if (first.isRepeat) continue;
            candidates = candidates.filter((x) => {
              if (!x.isRepeat) return false;
              // Budżet musi pozwalać na tę powtórkę
              return repeatsUsed + 1 <= targetRepeats;
            });
          } else {
            // Przed ostatnią parą: pilnuj żeby zostało miejsce na zamknięcie
            if (repeatsAvailableBeforeLastPair <= 0) {
              if (first.isRepeat) continue;
              candidates = candidates.filter((x) => !x.isRepeat);
            } else if (repeatsAvailableBeforeLastPair > maxPossibleRepeats) {
              if (!first.isRepeat)
                candidates = candidates.filter((x) => x.isRepeat);
            } else {
              const willFirstRepeat = first.isRepeat ? 1 : 0;
              const repeatsLeftAfterFirst =
                repeatsAvailableBeforeLastPair - willFirstRepeat;
              if (repeatsLeftAfterFirst < 0) {
                if (first.isRepeat) continue;
              }
              const maxPossibleAfterFirst = (pairsBeforeLastPair - 1) * 2 + 1;
              if (repeatsLeftAfterFirst > maxPossibleAfterFirst) {
                candidates = candidates.filter((x) => x.isRepeat);
              } else if (repeatsLeftAfterFirst === 0) {
                candidates = candidates.filter((x) => !x.isRepeat);
              }
            }

            // Globalny limit budżetu — zapobiega przekroczeniu targetRepeats
            // nawet gdy lokalna logika powyżej tego nie wyłapuje
            candidates = candidates.filter((x) => {
              const wouldAdd = (first.isRepeat ? 1 : 0) + (x.isRepeat ? 1 : 0);
              return repeatsUsed + wouldAdd <= targetRepeats;
            });
          }
        }
      }

      if (candidates.length === 0) continue;

      const second = candidates[Math.floor(Math.random() * candidates.length)];
      pairs.push([first.letter, second.letter]);

      const firstPs = pieceState.get(first.pieceKey);
      if (firstPs.uses === 0) firstPs.firstUsedAt = pairs.length;
      firstPs.uses++;
      if (firstPs.uses === 2) repeatsUsed++;

      const secondPs = pieceState.get(second.pieceKey);
      if (secondPs.uses === 0) secondPs.firstUsedAt = pairs.length;
      secondPs.uses++;
      if (secondPs.uses === 2) repeatsUsed++;

      // Zamknięcie kawałka blokuje kawałki które są "w trakcie" (uses=1),
      // bo są uwięzione w otwartym cyklu i nie mogą być powtórzone
      if (targetRepeats >= 1) {
        for (const ps of [firstPs, secondPs]) {
          if (ps.uses === 2) {
            for (const [key, state] of pieceState) {
              if (state.uses === 1) {
                schema
                  .find((g) => g.join("") === key)
                  ?.forEach((l) => loopBlocked.add(l));
              }
            }
          }
        }
      }

      if (applyBlock) {
        getBlockedLetters([first.letter, second.letter], schema).forEach((l) =>
          groupBlocked.add(l),
        );
      }

      placed = true;
      break;
    }

    if (!placed) return null;
  }

  return pairs.length === count ? pairs : null;
}

// =============================================================================
// SEKCJA 4: EKSPORT — generatePairsForType
// =============================================================================
//
// Parametry:
//   type    — "corners" | "corners4" | "edges"
//   count   — liczba par
//   modeA   — true=Tryb A, false=Tryb B, undefined=auto na podstawie count
//   options — { edgeVariant: 'A'|'B', skipPiece: number } (tylko krawędzie 6 par)
//
export function generatePairsForType(type, count, modeA, options = {}) {
  const schema =
    type === "corners" ? CORNERS : type === "corners4" ? CORNERS_4BLD : EDGES;
  const isCorners = type === "corners" || type === "corners4";
  const isModeA =
    modeA !== undefined ? modeA : isCorners ? count <= 3 : count <= 5;

  // 5 par rogów ma zbyt złożoną strukturę powtórek dla ogólnego silnika
  if (isCorners && count === 5 && !isModeA) {
    for (let attempt = 0; attempt < 500; attempt++) {
      const result = tryGen5CornerPairs(schema);
      if (result) return result;
    }
    return [];
  }

  if (isModeA) {
    const config = { blockingLimit: Infinity, targetRepeats: 0 };
    for (let attempt = 0; attempt < 200; attempt++) {
      const result = tryGenPairs(schema, count, config);
      if (result) return result;
    }
    return [];
  }

  let targetRepeats, blockingLimit;

  if (isCorners) {
    if (options.is4Plus1) {
      targetRepeats = 2;
    } else {
      targetRepeats = 1;
    }
    blockingLimit = 2;
  } else {
    targetRepeats = count <= 6 ? (options.edgeVariant === "B" ? 2 : 1) : 3;
    blockingLimit = 2;
  }

  const config = {
    blockingLimit,
    targetRepeats,
    skipPiece: options.skipPiece,
    is4Plus1: options.is4Plus1,
  };

  for (let attempt = 0; attempt < 500; attempt++) {
    const result = tryGenPairs(schema, count, config);
    if (result) return result;
  }

  return [];
}
