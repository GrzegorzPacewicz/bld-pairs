# BLD Pairs — kontekst projektu

## Co to jest
Aplikacja do treningu par liter blind solving (BLD) na kostkę Rubika 3x3.
Jeden plik HTML z wbudowanym CSS i JS. Hostowana na GitHub Pages.
Repo: https://github.com/GrzegorzPacewicz/bld-pairs
Live: https://grzegorzpacewicz.github.io/bld-pairs

## Schemat liter
**Rogi** (grupy po 3 — ten sam kawałek kostki):
AOL, BHK, CGD, NIT, SEJ, MRU, WPF

**Krawędzie** (grupy po 2 — ten sam kawałek kostki):
AE, BP, CL, DR, HF, GT, KI, MO, NW, ZS, UJ

## Logika generatora par

### Blokowanie kawałków
- Kawałek jest zablokowany gdy **jakakolwiek jego litera** wystąpiła już w sesji
- Wyjątek: **włamanie do cyklu** — ta sama litera może wystąpić drugi raz
- Po włamaniu kawałek jest zablokowany całkowicie
- Przykład rogów BHK: pojawia się B → H i K nadal dostępne. Pojawia się B drugi raz → BHK zablokowane całkowicie.

### Blokada liter (tryb `?`)
- Gdy liczba par ustawiona na `?`, po wygenerowaniu pary wszystkie litery z grup obu kawałków zostają zablokowane dla kolejnych par
- Blokada dotyczy tylko właściwego schematu (rogi blokują rogi, krawędzie blokują krawędzie)
- Skutek: 7 grup rogów → max **3 pary** rogów z blokadą; 11 grup krawędzi → max **5 par** krawędzi z blokadą
- Przy ręcznym wyborze liczby par blokada jest wyłączona

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
**Rogi:** 3→47%, 4→48%, 5→5% (lub ręczny wybór 3/4/5)
**Krawędzie:** 4→20%, 5→40%, 6→35%, 7→5% (lub ręczny wybór 4/5/6/7)
**Singiel (samotny róg):** pojawia się tylko przy `?` i tylko gdy wylosowano 3 lub 4 pary rogów (50% szansy). Przy 5 parach lub ręcznym wyborze — brak singla.
Domyślnie zaznaczone "?" (losowe z wagami)

## Kolejność
- **Wyświetlanie** (zapamiętywanie): rogi → krawędzie
- **Odpowiadanie**: krawędzie → rogi

## Ekrany
1. **Konfiguracja** — wybór trybu i liczby par
2. **Zapamiętywanie** — pary widoczne, timer odlicza w górę, przycisk STOP
3. **Odpowiadanie** — wpisywanie par z pamięci, przycisk "Pomiń" przy każdej parze
4. **Wyniki** — % poprawnych, czas, które pary błędne/pominięte

## Przyciski na ekranie wyników
- **↺ Powtórz** — te same pary, wróć do zapamiętywania
- **Kolejna →** — nowy losowy zestaw z tymi samymi ustawieniami
- **Konfiguracja** — wróć do ekranu konfiguracji

## Skróty klawiszowe (odpowiadanie)
- Wpisanie litery → auto-przeskok do następnego boxa
- Backspace → kasuje / cofa kursor
- Spacja → pomiń parę (desktop); przycisk "Pomiń" (mobile)

## Zrealizowane funkcje
- [x] Generator par z pełną logiką BLD
- [x] Blokowanie kawałków — po użyciu litery X z kawałka, tylko X może się powtórzyć (włamanie)
- [x] Włamanie do cyklu — ta sama litera może wystąpić drugi raz, po czym kawałek zablokowany
- [x] Blokada liter (tryb `?`) — cała grupa kawałka blokowana po użyciu; rogi max 3 pary, krawędzie max 5
- [x] Brak powtórzonych par
- [x] Parzystość krawędzi
- [x] Ważone losowanie liczby par
- [x] Tryby: rogi / krawędzie / mieszany
- [x] Timer zapamiętywania
- [x] Pomijanie par (przycisk + spacja)
- [x] Historia sesji z localStorage
- [x] Statystyki (średni %, średni czas memo, gry idealne/nieudane, % par poprawnie)
- [x] Singiel (samotna litera rogu) przy trybie ? gdy 3 lub 4 pary
- [x] Reset postępów
- [x] Scroll historii
- [x] GitHub Pages
- [x] test.js — testy jednostkowe (getBlockedLetters, blokada liter, blokowanie kawałków, singiel, sesja)
- [x] Wersja buildu — `const BUILD` w app.js, wyświetlana na ekranie konfiguracji (format: `v5 · 09.06 23:07`)

## TODO
- [ ] Edytor schematu liter — własne grupy rogów/krawędzi w ustawieniach

## Stack
- Vanilla HTML/CSS/JS — jeden plik index.html
- test.js — Node.js, zero zależności
- Docelowo: index.html, manifest.json, sw.js (PWA)
