# BLD Pairs — kontekst projektu

## Co to jest
Aplikacja do treningu par liter blind solving (BLD) na kostkę Rubika 3x3.
Jeden plik HTML z wbudowanym CSS i JS. Docelowo PWA na GitHub Pages.

## Schemat liter
**Rogi** (grupy po 3 — ten sam kawałek kostki):
AOL, BHK, CGD, NIT, SEJ, MRU, WPF

**Krawędzie** (grupy po 2 — ten sam kawałek kostki):
AE, BP, CL, DR, HF, GT, KI, MO, NW, ZS, UJ

## Logika generatora par
- Para nie może łączyć dwóch liter z tego samego kawałka
- Każdy kawałek może wystąpić maksymalnie 2 razy w sesji
- Po 2. użyciu kawałek jest zablokowany

## Tryby
- Tylko rogi
- Tylko krawędzie
- Mieszany (rogi + krawędzie)

## Liczba par (ważone losowanie)
**Rogi:** 3→45%, 4→45%, 5→10% (lub ręczny wybór 3/4/5)
**Krawędzie:** 4→30%, 5→30%, 6→30%, 7→10% (lub ręczny wybór 4/5/6/7)
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
- **Konfiguracja** — wróć do ekranu konfiguracji (TODO: jeszcze nie zaimplementowane)

## Skróty klawiszowe (odpowiadanie)
- Wpisanie litery → auto-przeskok do następnego boxa
- Backspace → kasuje / cofa kursor
- Spacja → pomiń parę (działa tylko na desktop)

## TODO — plan rozwoju
- [ ] Trzeci przycisk "Konfiguracja" na ekranie wyników
- [ ] localStorage — zapamiętanie konfiguracji między sesjami
- [ ] Historia sesji — data, tryb, % poprawnych, czas
- [ ] Edytor schematu liter — własne grupy rogów/krawędzi w ustawieniach
- [ ] PWA — manifest.json + sw.js
- [ ] GitHub Pages — hosting

## Stack
- Vanilla HTML/CSS/JS — jeden plik bld-pairs.html
- Zero frameworków, zero zależności (tylko Google Fonts)
- Docelowo 3 pliki: bld-pairs.html, manifest.json, sw.js
