# BLD Pairs — kontekst projektu

## Co to jest
Aplikacja do treningu par liter blind solving (BLD) na kostkę Rubika 3x3.
Pliki: index.html + css/style.css + js/{app,schema,generator,generator3bld,generator4bld,state,timer,render,events}.js + sw.js + manifest.json + icon.svg
Repo: https://github.com/GrzegorzPacewicz/bld-pairs
Live: https://bldpairs.grzegorzpacewicz.pl

## Schemat liter
**Rogi** (grupy po 3 — ten sam kawałek kostki, 3 strony = 3 litery):
AOL, BHK, CGD, NIT, SEJ, MRU, WPF

**Krawędzie** (grupy po 2 — ten sam kawałek kostki, 2 strony = 2 litery):
AE, BP, CL, DR, HF, GT, KI, MO, NW, ZS, UJ

Schemat można edytować w ustawieniach (ekran "Schemat liter"). Własny schemat zapisywany w localStorage pod kluczem `bld-schema` (3x3) i `bld-schema-4bld` (4x4).

## Logika generatora par (docelowa)

### Wspólne zasady
- Para nie może łączyć dwóch liter z tego samego kawałka
- Ta sama para nie może wystąpić dwa razy w sesji
- Kawałek może wystąpić maksymalnie dwa razy w sesji (powtórka/włamanie)
- Zasada kolejności: 2. litera pary N ≠ 1. litera pary N+1
- **Blokada pętli**: powtórka (drugie użycie kawałka) blokuje wszystkie kawałki między pierwszym a drugim użyciem

### Matematyka powtórek

**Rogi** (7 kawałków × 3 litery):
| Wariant | Liter | Powtórek | Tryb |
|---------|-------|----------|------|
| 2 pary  | 4     | 0        | A    |
| 2+1     | 5     | 0        | A    |
| 3 pary  | 6     | 0        | A    |
| 3+1     | 7     | 0        | A    |
| 4 pary  | 8     | 1        | B    |
| 4+1     | 9     | 2        | B    |
| 5 par   | 10    | 3        | B    |

**Krawędzie** (11 kawałków × 2 litery, brak singla):
| Wariant | Liter | Powtórek | Pominięte | Tryb |
|---------|-------|----------|-----------|------|
| ≤5 par | ≤10 | 0 | 0 | A |
| 6 par (wersja A) | 12 | 1 | 0 | B, 50% |
| 6 par (wersja B) | 12 | 2 | 1 | B, 50% |
| 7 par | 14 | 3 | 0 | B |

### Bez powtórek
- Wszystkie pary mają unikalne kawałki (blokada grupowa)
- Singiel (rogi): z nieużytego kawałka

### z powtórkami — 1 powtórka (4 pary rogów, 6 par krawędzi wersja A)
- Pary 1–N-1: unikalne kawałki
- Ostatnia para: [nowy, zamknięcie] — zamknięcie = powtórka

### z powtórkami — 4+1 (2 powtórki z singlem)
- Para 1: nowy + nowy
- Powtórka 1 może wystąpić na pozycjach:
  - para 2, miejsce 1 lub 2
  - para 3, miejsce 1 (tylko — miejsce 2 wykluczone bo nie ma miejsca na zamknięcie)
- Pozostałe pary: nowy + nowy
- Singiel: powtórka 2 = kawałek otwarty przez powtórkę 1
- Blokada: kawałek uwięziony między otwarciem a zamknięciem powtórki 1 jest zablokowany

### z powtórkami — 2 powtórki (6 par krawędzi wersja B)
- Pary 1–2: unikalne kawałki
- Para 2 (2. miejsce) lub para 3 (1. miejsce): powtórka 1 → blokuje kawałki między
- Para 4: powtórka 2 (zamknięcie)
- Krawędzie wersja B: 1 kawałek pominięty (nie używany w sesji)

### z powtórkami — 3 powtórki (5 par rogów, 7 par krawędzi)
- Pary 1–2: unikalne kawałki
- Para 2 (2. miejsce) lub para 3 (1. miejsce): powtórka 1 → blokuje kawałki między
- Para 4: powtórka 2 → blokuje kawałki między
- Ostatnia para/singiel: powtórka 3 (zamknięcie z kawałka po powtórce 2)

### Warianty rogów — wagi (ważone losowanie):
| Wariant | Waga | Tryb | Singiel |
|---------|------|------|---------|
| 2 pary  | 5%   | A    | nie |
| 2+1     | 9%   | A    | z nieużytego kawałka |
| 3 pary  | 27%  | A    | nie |
| 3+1     | 27%  | A    | z nieużytego kawałka |
| 4 pary  | 18%  | B, 1 powtórka | nie |
| 4+1     | 9%   | B, 2 powtórki | z kawałka otwartego przez powtórkę 1 |
| 5 par   | 5%   | B, 3 powtórki | nie |

### Warianty par krawędzi (wybór użytkownika lub losowanie):
- "4"–"5" → bez powtórek (0 powtórek)
- "6" → z powtórkami, 1 powtórka LUB 2 powtórki (1 pominięty) — 50/50
- "7" → z powtórkami, 3 powtórki

## Tryby
- Tylko rogi
- Tylko krawędzie
- Mieszany (rogi + krawędzie)

## Liczba par (ważone losowanie)
**Rogi:** UI pokazuje 2/3/4/5/"?". Przy "?" losuje z pełnych wag 7 wariantów. Przy ręcznym wyborze (np. 3) generator losuje 50/50 między wariantem bez singla (3) a z singlem (3+1). Wyjątek: 5 par nie ma wariantu +1.
**Krawędzie:** 4→6%, 5→35%, 6→42%, 7→15% (lub ręczny wybór 4/5/6/7)
**Singiel:** pojawia się przy rogach (warianty 2+1, 3+1, 4+1), nigdy przy krawędziach
Domyślnie zaznaczone "?" (losowe z wagami)

## Kolejność
- **Wyświetlanie** (zapamiętywanie): rogi → krawędzie
- **Odpowiadanie**: krawędzie → rogi

## Ekrany
1. **Konfiguracja** — wybór trybu i liczby par; przyciski "Jak grać?" i "Schemat liter"; pasek build-info na dole
2. **Zapamiętywanie** — pary widoczne, timer odlicza w górę, przycisk STOP
3. **Odpowiadanie** — wpisywanie par z pamięci, przycisk "Pomiń" przy każdej parze
4. **Wyniki** — % poprawnych, czas, które pary błędne/pominięte; przyciski do historii
5. **Statystyki / Historia** — dostępna z ekranu wyników i konfiguracji
6. **Schemat liter** — edytor grup rogów i krawędzi z walidacją; "Przywróć domyślne"; dla 4BLD: rogi jako grupy, wingsy i centry jako kompaktowa siatka liter
7. **Jak grać?** — ekran pomocy z opisem mechaniki i skrótów

## Pasek build-info (dół ekranu konfiguracji)
- Lewa strona: link do grzegorzpacewicz.pl + link GitHub (jeden pod drugim)
- Prawa strona: wersja + data buildu (`const BUILD` w render.js)
- Format BUILD: `"v1.14 · 12.06"`

## Wersjonowanie
- **Major** (v2.x) — zmiana interfejsu lub flow użytkownika
- **Minor** (v1.x) — zmiana logiki / zachowania generatora
- **Patch** (v1.0.x) — bugfix

## Przyciski na ekranie wyników
- **↺ Powtórz** — te same pary, wróć do zapamiętywania
- **Kolejna →** — nowy losowy zestaw z tymi samymi ustawieniami
- **Statystyki** — otwiera ekran historii/statystyk
- **⚙** (górny pasek) — wróć do ekranu konfiguracji

## Skróty klawiszowe (odpowiadanie)
- Wpisanie litery → auto-przeskok do następnego boxa
- Backspace → kasuje / cofa kursor
- Spacja → pomiń parę (tylko desktop; na mobile przycisk "Pomiń")

## PWA / hosting
- Subdomena: bldpairs.grzegorzpacewicz.pl (CNAME w Cloudflare → grzegorzpacewicz.github.io, proxy wyłączone)
- GitHub Pages custom domain ustawiony w repo Settings → Pages
- sw.js: strategia **network-first** — zawsze pobiera świeżą wersję, cache jako fallback offline
- Przy zmianie SW nie trzeba już ręcznie podbijać CACHE version (network-first pobiera świeże zasoby automatycznie)
- manifest.json: categories ["games", "education"], lang "pl"

## WCAG
- Wszystkie kolory tekstu funkcjonalnego: #6b6b6b (5.1:1 na białym ✅)
- Elementy dekoracyjne (weight-hint, dash, idx): #bbb — celowo, nieistotne informacyjnie

## Zrealizowane funkcje
- [x] Generator par z logiką BLD — bez powtórek/z powtórkami, zasada kolejności, zamknięcie cyklu, singiel z nieużytego kawałka
- [x] Blokowanie kawałków — włamanie do klocka (max 2 użycia, dowolna litera za drugim razem)
- [x] Blokada grupowa zależna od liczby par
- [x] Brak powtórzonych par
- [x] Parzystość krawędzi
- [x] Ważone losowanie liczby par (rogi: 7 wariantów, krawędzie: 4–7)
- [x] Tryby: rogi / krawędzie / mieszany
- [x] Timer zapamiętywania
- [x] Pomijanie par (przycisk + spacja desktop)
- [x] Historia sesji z localStorage
- [x] Statystyki na ekranie wyników
- [x] Singiel przy rogach (warianty 2+1, 3+1, 4+1)
- [x] Reset historii
- [x] GitHub Pages + subdomena bldpairs.grzegorzpacewicz.pl
- [x] test.js — 86 testów jednostkowych (Node.js, zero zależności)
- [x] Wersja buildu — `const BUILD` w render.js
- [x] Edytor schematu liter z walidacją
- [x] Ekran pomocy "Jak grać?"
- [x] WCAG AA kontrast
- [x] Favicon + apple-touch-icon
- [x] SW network-first strategy
- [x] Cancel gry — przerwanie sesji bez zapisywania wyniku do historii
- [x] Podział app.js na moduły — js/{schema,state,timer,render,events,app}.js
- [x] 4BLD — osobna sekcja z rogami, wingsami i centrami (v1.15)
- [x] Edytor schematów 4BLD — rogi (grupy po 3), wingsy i centry (siatka liter) (v2.0)
- [x] Nowe wagi rogów — 7 wariantów z CORNER_VARIANTS (v2.14)
- [x] Tryb 4+1 — targetRepeats=2, pozycje powtórki 1: para 2 miejsce 1/2, para 3 miejsce 1 (v2.14)
- [x] generateCorners współdzielone — w generator3bld.js, importowane przez generator4bld.js (v2.14)
- [x] Fix generateWingsPairsWithRepeat — unikalne litery, 1 powtórka nie w tej samej ani sąsiednich parach (v2.14)

## Plan rozwoju
- [ ] **Usunięcie ostatniego wyniku** — przycisk "usuń ostatni" na ekranie historii
- [ ] **Krawędzie bez memo swap** — opcja trybu gdzie krawędzie mogą mieć singiel (nieparzysta liczba liter), ta sama logika bez powtórek / z powtórkami co rogi

## 4BLD (zaimplementowane v1.15)

Osobna sekcja z przełącznikiem 3x3/4x4 na ekranie konfiguracji.

### Rogi (4BLD)
Identyczna logika jak 3x3: 7 kawałków × 3 litery, te same wagi i tryby (A/B), singiel według wariantów.

### Wingsy (4BLD)
23 litery (A-Z + Ł bez J), każda = osobny kawałek:
| Wariant | Liter | Powtórek | Waga |
|---------|-------|----------|------|
| 11+1 | 23 | 0 | 50% |
| 12 par | 24 | 1 | 50% |

Zasady dla 12 par (powtórka):
- każda litera max 1 raz, poza dokładnie 1 powtórką
- powtórzona litera nie może być w tej samej parze ani w sąsiednich parach
- zasada kolejności: 2. litera pary N ≠ 1. litera pary N+1

### Centry (4BLD)
23 litery (A-Z + Ł bez J), każda = osobny kawałek:
| Wariant | Liter | Powtórek | Waga |
|---------|-------|----------|------|
| 6 par | 12 | 0 | 20% |
| 6+1 | 13 | 0 | 20% |
| 7 par | 14 | 0 | 20% |
| 7+1 | 15 | 0 | 20% |
| 8 par | 16 | 0 | 20% |

Zasady centrów: każda litera max 1 raz, bez zasady kolejności (automatycznie spełniona).

### Kolejność (4BLD)
- Wyświetlanie: rogi → wingsy → centry
- Odpowiadanie: centry → wingsy → rogi

### Historia
Historia zapisuje `is4BLD: true/false` i wyświetla "4×4" przed nazwą trybu.

## Architektura generatorów

### Podział plików
- `generator.js` — silnik niskopoziomowy (generuje pary liter)
- `generator3bld.js` — logika sesji 3BLD + `generateCorners(schema, variant)` (współdzielona z 4BLD)
- `generator4bld.js` — logika sesji 4BLD, importuje `generateCorners` z `generator3bld.js`

### generator.js
Eksportuje `generatePairsForType(type, count, modeA, options)`.

**`tryGen5CornerPairs(schema)`**
Specjalny przypadek dla 5 par rogów (3 powtórki). Stała sekwencja:
`nowy+nowy → powt+nowy → nowy+nowy → powt+nowy → nowy+powt`
Ogólny silnik nie potrafi wymusić tej kolejności, stąd osobna funkcja.

**`tryGenPairs(schema, count, config)`**
Ogólny silnik dla rogów ≤4 pary i wszystkich krawędzi. Metoda prób i błędów (do 1000 iteracji), przy ślepym zaułku zwraca `null`.
- `blockingLimit` — ile pierwszych par stosuje blokadę grupową (`groupBlocked`)
- `targetRepeats` — budżet powtórek; ostatnia para zawsze zamyka cykl (first nowy, second powtórka)
- `loopBlocked` — litery zablokowane po zamknięciu kawałka (kawałki "w trakcie" uwięzione w cyklu)
- zasada kolejności: 1. litera pary N nie może być z kawałka 2. litery pary N-1

**`generatePairsForType(type, count, modeA, options)`**
Router: wybiera silnik, ustawia config, ponawia próby (200–500 razy).

**Config silnika (`tryGenPairs`):**
| Przypadek | targetRepeats | blockingLimit |
|---|---|---|
| bez powtórek (rogi ≤3, krawędzie ≤5) | 0 | Infinity |
| Rogi 4 pary | 1 | 2 |
| Rogi 4+1 | 2 | 2 |
| Krawędzie 6 par A | 1 | 2 |
| Krawędzie 6 par B | 2 | 2 |
| Krawędzie 7 par | 3 | 2 |

### generator3bld.js
`generateCorners(schema, variant)` — wspólna funkcja dla 3BLD i 4BLD:
- przyjmuje schemat jako parametr (`CORNERS` lub `CORNERS_4BLD`)
- `variant` to jeden z 7 wariantów (2, 2+1, 3, 3+1, 4, 4+1, 5)
- zwraca `{ pairs, singiel }`

`generateSession(mode, cornerCount, edgeCount)` — sesja 3BLD
- `cornerCount`: 2|3|4|5|"?" — przy "?" losuje z pełnych wag CORNER_VARIANTS, przy liczbie losuje 50/50 singiel

### generator4bld.js
Importuje `generateCorners` z `generator3bld.js`.
Osobne funkcje dla wingsów i centrów.

## Stack
- Vanilla HTML/CSS/JS — index.html + css/style.css + js/{schema,generator,generator3bld,generator4bld,state,timer,render,events,app}.js
- test.js — Node.js, zero zależności
- PWA: manifest.json, sw.js, icon.svg
