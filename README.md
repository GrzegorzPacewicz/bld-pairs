# BLD Pairs

Aplikacja do treningu par liter blind solving na kostkę Rubika 3x3.

**[Zagraj →](https://grzegorzpacewicz.github.io/bld-pairs/)**

## Funkcje

- Tryby: rogi, krawędzie, mieszany
- Generator par z pełną logiką BLD: blokowanie kawałków, włamanie do cyklu, zasada kolejności, brak duplikatów
- Blokada grupowa: pełna dla ≤3 par rogów / ≤5 par krawędzi; brak dodatkowej przy 4–5 rogach / 6–7 krawędziach
- Losowa singlowa litera rogu przy trybie `?` lub ręcznym wyborze 2–3 par (50% szansy, nie przy 5 parach)
- Ważone losowanie liczby par (rogi: 2–5, krawędzie: 4–7)
- Timer zapamiętywania
- Sprawdzanie odpowiedzi z oceną
- Historia sesji ze statystykami (średni %, średni czas memo, gry idealne/nieudane) — dostępna z ekranu wyników
- Edytor własnego schematu liter (rogi i krawędzie) — zapisywany między sesjami
- Reset historii
- Zapamiętywanie konfiguracji między sesjami
- Działa offline (PWA)

## Stack

Vanilla HTML/CSS/JS — zero frameworków, zero zależności (tylko Google Fonts).
