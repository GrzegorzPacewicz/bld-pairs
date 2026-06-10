# BLD Pairs

Aplikacja do treningu zapamiętywania par liter w metodzie blind solving (BLD) na kostkę Rubika 3x3.

**[Zagraj → bldpairs.grzegorzpacewicz.pl](https://bldpairs.grzegorzpacewicz.pl)**

---

## Czym jest BLD Pairs?

W metodzie blind solving każdy klocek kostki ma przypisane litery — jedna na każdą stronę. Rozwiązanie polega na zapamiętaniu sekwencji par liter, gdzie każda para oznacza zamianę dwóch klocków. BLD Pairs generuje losowe zestawy takich par i sprawdza, czy potrafisz je odtworzyć z pamięci.

---

## Jak grać

1. **Skonfiguruj** — wybierz tryb (rogi / krawędzie / mieszany) i liczbę par
2. **Zapamiętaj** — pary są widoczne, timer odlicza czas
3. **Odpowiedz** — wpisz pary z pamięci (krawędzie pierwsze, potem rogi)
4. **Sprawdź wynik** — oceń błędy, powtórz zestaw lub losuj nowy

---

## Funkcje

### Generowanie par
- Odwzorowanie logiki BLD: żadna para nie łączy liter z tego samego klocka, brak duplikatów par w sesji
- **Blokowanie kawałków** — każdy klocek może pojawić się co najwyżej dwa razy (włamanie do cyklu): za pierwszym razem dowolna litera, za drugim — tylko ta sama
- **Blokada grupowa** — przy małej liczbie par (≤3 rogi, ≤5 krawędzie) każdy klocek pojawia się co najwyżej raz; przy większej liczbie par możliwe powtórki
- **Singiel** — przy `?` lub ręcznym wyborze 2–3 par rogów może pojawić się samotna litera (50% szansy), ćwicząca parzystość

### Tryby i liczba par
| Typ | Ręczny wybór | Tryb `?` (wagi) |
|-----|-------------|-----------------|
| Rogi | 2 / 3 / 4 / 5 | 2→5%, 3→44%, 4→46%, 5→5% |
| Krawędzie | 4 / 5 / 6 / 7 | 4→20%, 5→40%, 6→35%, 7→5% |

Tryb `?` losuje liczbę par z wagami i automatycznie dobiera odpowiednią blokadę.

### Schemat liter
Domyślny schemat (Rogi: AOL BHK CGD NIT SEJ MRU WPF; Krawędzie: AE BP CL DR HF GT KI MO NW ZS UJ) można zastąpić własnym w ekranie **Schemat liter**. Własny schemat jest zapisywany między sesjami.

### Statystyki i historia
Każda sesja trafia do historii (localStorage). Na ekranie wyników dostępne są:
- Średni % poprawnych par
- % gier idealnych i nieudanych
- Średni czas zapamiętywania
- Lista ostatnich 50 sesji

### Klawiatura (ekran odpowiedzi)
| Klawisz | Akcja |
|---------|-------|
| litera | wpisz i przeskocz do następnego pola |
| `Backspace` | usuń / cofnij kursor |
| `Spacja` | pomiń parę (tylko desktop; na mobile użyj przycisku „Pomiń") |

---

## Uruchamianie lokalnie

Brak zależności — wystarczy otworzyć `index.html` w przeglądarce.

```bash
# Testy jednostkowe (Node.js)
node test.js
```

---

## Stack

- Vanilla HTML / CSS / JS — zero frameworków, zero zależności (tylko Google Fonts)
- PWA — działa offline (service worker, manifest)
- Testy jednostkowe — `test.js`, Node.js, zero zależności
