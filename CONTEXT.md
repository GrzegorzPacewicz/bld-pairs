# BLD Pairs — kontekst projektu

## Co to jest
Aplikacja do treningu par liter blind solving (BLD) na kostkę Rubika 3x3.
Pliki: index.html + css/style.css + js/{app,schema,generator,state,timer,render,events}.js + sw.js + manifest.json + icon.svg
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
| ≤3 pary | ≤6 | 0 | A |
| 3+1 | 7 | 0 | A |
| 4 pary | 8 | 1 | B |
| 4+1 | 9 | 2 | B |
| 5 par | 10 | 3 | B |

**Krawędzie** (11 kawałków × 2 litery, brak singla):
| Wariant | Liter | Powtórek | Pominięte | Tryb |
|---------|-------|----------|-----------|------|
| ≤5 par | ≤10 | 0 | 0 | A |
| 6 par (wersja A) | 12 | 1 | 0 | B, 50% |
| 6 par (wersja B) | 12 | 2 | 1 | B, 50% |
| 7 par | 14 | 3 | 0 | B |

### Tryb A (bez powtórek)
- Wszystkie pary mają unikalne kawałki (blokada grupowa)
- Singiel (rogi, 50%): z nieużytego kawałka

### Tryb B — 1 powtórka (4 pary rogów, 6 par krawędzi wersja A)
- Pary 1–N-1: unikalne kawałki
- Ostatnia para: [nowy, zamknięcie] — zamknięcie = powtórka

### Tryb B — 2 powtórki (4+1 rogów, 6 par krawędzi wersja B)
- Pary 1–2: unikalne kawałki
- Para 2 (2. miejsce) lub para 3 (1. miejsce): powtórka 1 → blokuje kawałki między
- Para 4: powtórka 2 (zamknięcie)
- Singiel (rogi): z kawałka który pojawił się po powtórce 1
- Krawędzie wersja B: 1 kawałek pominięty (nie używany w sesji)

### Tryb B — 3 powtórki (5 par rogów, 7 par krawędzi)
- Pary 1–2: unikalne kawałki
- Para 2 (2. miejsce) lub para 3 (1. miejsce): powtórka 1 → blokuje kawałki między
- Para 4: powtórka 2 → blokuje kawałki między
- Ostatnia para/singiel: powtórka 3 (zamknięcie z kawałka po powtórce 2)

### Warianty par rogów (wybór użytkownika lub losowanie):
- "3" → 3 pary (Tryb A) LUB 2 pary + singiel (Tryb A) — 50/50
- "4" → 4 pary (Tryb B, 1 powt.) LUB 3 pary + singiel (Tryb A) — 50/50
- "5" → 5 par (Tryb B, 3 powt.) LUB 4 pary + singiel (Tryb B, 2 powt.) — 50/50

### Warianty par krawędzi (wybór użytkownika lub losowanie):
- "4"–"5" → Tryb A (0 powtórek)
- "6" → Tryb B, 1 powtórka LUB 2 powtórki (1 pominięty) — 50/50
- "7" → Tryb B, 3 powtórki

## Tryby
- Tylko rogi
- Tylko krawędzie
- Mieszany (rogi + krawędzie)

## Liczba par (ważone losowanie)
**Rogi:** 2→5%, 3→15%, 4→47%, 5→31%, (ręczny wybór 2/3/4/5); każdy wariant 50/50: N par LUB (N-1) par + singiel
**Krawędzie:** 4→6%, 5→35%, 6→42%, 7→15% (lub ręczny wybór 4/5/6/7)
**Singiel:** pojawia się przy rogach (50% szansy), nigdy przy krawędziach
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
- [x] Generator par z logiką BLD — Tryb A/B, zasada kolejności, zamknięcie cyklu, singiel z nieużytego kawałka
- [x] Blokowanie kawałków — włamanie do klocka (max 2 użycia, dowolna litera za drugim razem)
- [x] Blokada grupowa zależna od liczby par
- [x] Brak powtórzonych par
- [x] Parzystość krawędzi
- [x] Ważone losowanie liczby par (rogi: 2–5, krawędzie: 4–7)
- [x] Tryby: rogi / krawędzie / mieszany
- [x] Timer zapamiętywania
- [x] Pomijanie par (przycisk + spacja desktop)
- [x] Historia sesji z localStorage
- [x] Statystyki na ekranie wyników
- [x] Singiel przy rogach (50% szansy)
- [x] Reset historii
- [x] GitHub Pages + subdomena bldpairs.grzegorzpacewicz.pl
- [x] test.js — 64 testy jednostkowe (Node.js, zero zależności)
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

## Plan rozwoju
- [ ] **Usunięcie ostatniego wyniku** — przycisk "usuń ostatni" na ekranie historii
- [ ] **Krawędzie bez memo swap** — opcja trybu gdzie krawędzie mogą mieć singiel (nieparzysta liczba liter), ta sama logika Tryb A / Tryb B co rogi

## 4BLD (zaimplementowane v1.15)

Osobna sekcja z przełącznikiem 3x3/4x4 na ekranie konfiguracji.

### Rogi (4BLD)
Identyczna logika jak 3x3: 7 kawałków × 3 litery, te same wagi i tryby (A/B), singiel 50%.

### Wingsy (4BLD)
23 litery (A-Z + Ł bez J), każda = osobny kawałek:
| Wariant | Liter | Powtórek | Waga |
|---------|-------|----------|------|
| 11+1 | 23 | 0 | 50% |
| 12 par | 24 | 1 | 50% |

### Centry (4BLD)
23 litery (A-Z + Ł bez J), każda = osobny kawałek:
| Wariant | Liter | Powtórek | Waga |
|---------|-------|----------|------|
| 6 par | 12 | 0 | 20% |
| 6+1 | 13 | 0 | 20% |
| 7 par | 14 | 0 | 20% |
| 7+1 | 15 | 0 | 20% |
| 8 par | 16 | 0 | 20% |

### Kolejność (4BLD)
- Wyświetlanie: rogi → wingsy → centry
- Odpowiadanie: centry → wingsy → rogi

### Historia
Historia zapisuje `is4BLD: true/false` i wyświetla "4×4" przed nazwą trybu.

## Stack
- Vanilla HTML/CSS/JS — index.html + css/style.css + js/{schema,generator,state,timer,render,events,app}.js
- test.js — Node.js, zero zależności
- PWA: manifest.json, sw.js, icon.svg
