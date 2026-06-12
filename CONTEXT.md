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

Schemat można edytować w ustawieniach (ekran "Schemat liter"). Własny schemat zapisywany w localStorage pod kluczem `bld-schema`.

## Logika generatora par (docelowa)

### Matematyka włamań
- Kostka ma 7 rogów do ułożenia (bez bufora) = 7 targetów bazowo
- Kostka ma 11 krawędzi do ułożenia (bez bufora) = 11 targetów bazowo
- Każde włamanie do cyklu dodaje 1 target
- Memo swap dla krawędzi eliminuje singiel → zawsze parzysta liczba liter

### Rogi — Tryb A (effectiveCc ≤ 3)
Stosowany gdy: 3 pary bez singla, 2 pary + singiel, lub **3 pary + singiel** (cc=4 z singlem)
1. Pary 1–N: unikalne kawałki, żadnych powtórzeń między parami
2. Zasada kolejności: druga litera pary N ≠ pierwsza litera pary N+1
3. Brak wymogu zamknięcia ostatniej pary
4. Singiel (50/50): litera z kawałka który **nie wystąpił** w żadnej parze
5. Singiel nie podlega zasadzie kolejności

### Rogi — Tryb B (effectiveCc ≥ 4)
Stosowany gdy: 4–5 par bez singla, lub 4 pary + singiel (cc=5 z singlem)
1. Pary 1–2: unikalne kawałki
2. Para 3+: pierwsza litera = włamanie (z kawałka który już wystąpił), druga litera = nowy kawałek
3. Ostatnia para: pierwsza litera = nowy kawałek, druga litera = zamknięcie (z kawałka który pojawił się w parach 3+, nie z par 1-2)
4. Zasada kolejności: druga litera pary N ≠ pierwsza litera pary N+1
5. Singiel (50/50): litera z kawałka który **nie wystąpił** w żadnej parze
6. Singiel nie podlega zasadzie kolejności

### Warianty par rogów (wybór użytkownika lub losowanie):
- "3" → 3 pary (Tryb A) LUB 2 pary + singiel (Tryb A) — 50/50
- "4" → 4 pary (Tryb B) LUB 3 pary + singiel (**Tryb A**) — 50/50
- "5" → 5 par (Tryb B) LUB 4 pary + singiel (Tryb B) — 50/50

### Krawędzie — Tryb A (4–5 par)
1. Wszystkie pary unikalne, żadnych powtórzeń kawałków
2. Zasada kolejności: druga litera pary N ≠ pierwsza litera pary N+1
3. Brak wymogu zamknięcia ostatniej pary
4. Brak singla (memo swap)

### Krawędzie — Tryb B (6–7 par)
1. Pary 1–2: unikalne kawałki
2. Para 3+: może zawierać literę z kawałka który już wystąpił (włamanie do cyklu)
3. Zasada kolejności: druga litera pary N ≠ pierwsza litera pary N+1
4. **Blokada pętli**: drugie użycie kawałka blokuje wszystkie kawałki, które pojawiły się między pierwszym a drugim użyciem (zamknięcie pętli)
5. Ostatnia litera ostatniej pary = litera z kawałka który już wystąpił (zamknięcie cyklu)
6. Brak singla (memo swap)

### Pozostałe zasady (obie grupy)
- Para nie może łączyć dwóch liter z tego samego kawałka
- Ta sama para nie może wystąpić dwa razy w sesji
- Kawałek może wystąpić maksymalnie dwa razy w sesji (włamanie)
- Drugie użycie kawałka = dowolna litera z tego kawałka (nie musi być ta sama)
- Po drugim użyciu kawałek zablokowany całkowicie

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
6. **Schemat liter** — edytor grup rogów i krawędzi z walidacją; "Przywróć domyślne"
7. **Jak grać?** — ekran pomocy z opisem mechaniki i skrótów

## Pasek build-info (dół ekranu konfiguracji)
- Lewa strona: link do grzegorzpacewicz.pl + link GitHub (jeden pod drugim)
- Prawa strona: wersja + data buildu (`const BUILD` w render.js)
- Format BUILD: `"v1.13 · 12.06"`

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

## Plan rozwoju
- [ ] **Usunięcie ostatniego wyniku** — przycisk "usuń ostatni" na ekranie historii
- [ ] **Krawędzie bez memo swap** — opcja trybu gdzie krawędzie mogą mieć singiel (nieparzysta liczba liter), ta sama logika Tryb A / Tryb B co rogi
- [ ] **4BLD** — obsługa kostki 4x4

## Stack
- Vanilla HTML/CSS/JS — index.html + css/style.css + js/{schema,generator,state,timer,render,events,app}.js
- test.js — Node.js, zero zależności
- PWA: manifest.json, sw.js, icon.svg
