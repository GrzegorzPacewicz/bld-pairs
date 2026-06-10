# BLD Pairs — kontekst projektu

## Co to jest
Aplikacja do treningu par liter blind solving (BLD) na kostkę Rubika 3x3.
Pliki: index.html + style.css + app.js + sw.js + manifest.json + icon.svg
Repo: https://github.com/GrzegorzPacewicz/bld-pairs
Live: https://bldpairs.grzegorzpacewicz.pl

## Schemat liter
**Rogi** (grupy po 3 — ten sam kawałek kostki, 3 strony = 3 litery):
AOL, BHK, CGD, NIT, SEJ, MRU, WPF

**Krawędzie** (grupy po 2 — ten sam kawałek kostki, 2 strony = 2 litery):
AE, BP, CL, DR, HF, GT, KI, MO, NW, ZS, UJ

Schemat można edytować w ustawieniach (ekran "Schemat liter"). Własny schemat zapisywany w localStorage pod kluczem `bld-schema`.

## Logika par

### Blokowanie kawałków
- Kawałek może pojawić się **maksymalnie dwa razy** w sesji
- **Włamanie do klocka** — za pierwszym razem dowolna litera z klocka, za drugim razem **dowolna litera z tego samego klocka** (niekoniecznie ta sama)
- Po drugim użyciu klocek jest całkowicie zablokowany
- Przykład rogów BHK: pojawia się B → drugi raz może pojawić się B, H lub K → po tym BHK zablokowane całkowicie

### Blokada grupowa
Zależy od **liczby par**, nie od trybu `?`:
- **Rogi ≤ 3 par** i **Krawędzie ≤ 5 par**: pełna blokada grupowa — po wygenerowaniu pary wszystkie litery obu kawałków blokowane dla kolejnych par. Skutek: 7 grup rogów → max 3 pary; 11 grup krawędzi → max 5 par.
- **Rogi 4–5 par** i **Krawędzie 6–7 par**: brak dodatkowej blokady — pieceState naturalnie ogranicza każdy kawałek do 2 użyć (włamanie do cyklu), co pozwala na powtórki grup na parze 4–5 / 6–7.
- Tryb `?` losuje liczbę par i stosuje odpowiednią blokadę dla wylosowanej liczby.

### Pozostałe zasady
- Para nie może łączyć dwóch liter z tego samego kawałka
- Ta sama para nie może wystąpić dwa razy w sesji
- **Krawędzie:** zawsze parzysta liczba par (memo swap)
- **Rogi:** mogą być nieparzyste (parity = Z na końcu)

## Tryby
- Tylko rogi
- Tylko krawędzie
- Mieszany (rogi + krawędzie)

## Liczba par (ważone losowanie)
**Rogi:** 2→5%, 3→44%, 4→46%, 5→5% (lub ręczny wybór 2/3/4/5)
**Krawędzie:** 4→20%, 5→40%, 6→35%, 7→5% (lub ręczny wybór 4/5/6/7)
**Singiel (samotny róg):** pojawia się gdy `cornerCount` jest `?` lub ≤ 4, i wylosowano cc ≠ 5 (50% szansy). Przy ręcznym wyborze 5 par — brak singla.
- cc = 2: singiel z klocka **nieużytego** w żadnej parze
- cc = 3 lub 4: singiel z dowolnego klocka użytego < 2 razy (może być klocek z pary)
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
- Prawa strona: wersja + data buildu (`const BUILD` w app.js)
- Format BUILD: `"v1.0 · 10.06"`

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
- [x] Generator par z pełną logiką BLD
- [x] Blokowanie kawałków — włamanie do klocka (max 2 użycia, dowolna litera za drugim razem)
- [x] Blokada grupowa zależna od liczby par (pełna dla ≤3 rogów / ≤5 krawędzi)
- [x] Brak powtórzonych par
- [x] Parzystość krawędzi
- [x] Ważone losowanie liczby par (rogi: 2–5, krawędzie: 4–7)
- [x] Tryby: rogi / krawędzie / mieszany
- [x] Timer zapamiętywania
- [x] Pomijanie par (przycisk + spacja desktop)
- [x] Historia sesji z localStorage
- [x] Statystyki na ekranie wyników
- [x] Singiel przy `?` lub ręcznym wyborze 2–4 par (50% szansy); cc=2 z nieużytego klocka, cc=3-4 z klocka użytego < 2 razy
- [x] Reset historii
- [x] GitHub Pages + subdomena bldpairs.grzegorzpacewicz.pl
- [x] test.js — 54 testy jednostkowe (Node.js, zero zależności)
- [x] Wersja buildu — `const BUILD` w app.js
- [x] Edytor schematu liter z walidacją
- [x] Ekran pomocy "Jak grać?"
- [x] WCAG AA kontrast
- [x] Favicon + apple-touch-icon
- [x] SW network-first strategy

## Plan rozwoju
- [ ] **Cancel gry** — przerwanie sesji w trakcie zapamiętywania lub odpowiadania bez zapisywania wyniku do historii
- [ ] **Usunięcie ostatniego wyniku** — przycisk "usuń ostatni" na ekranie historii
- [ ] **4BLD** — obsługa kostki 4x4: nowe litery/schemat dla skrzydełek (wings) i narożników (corners), prawdopodobnie nowy tryb lub rozszerzenie istniejącego

## Stack
- Vanilla HTML/CSS/JS — index.html + style.css + app.js
- test.js — Node.js, zero zależności
- PWA: manifest.json, sw.js, icon.svg
