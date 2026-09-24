# Poeple 💩

De Nederlandse versie van [Poople](https://poople.io/): een dagelijkse **woordladder** naar **POEP**.

Je krijgt een startwoord van vier letters. Verander steeds precies één letter, elk tussenwoord
moet een bestaand Nederlands woord zijn, en probeer zo snel mogelijk bij POEP uit te komen.
*Par* is het kleinst mogelijke aantal stappen.

```
VOER → VOET → POET → POEP
```

## Spelen

Het is een statische site zonder build-stap of afhankelijkheden:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(Je kunt `index.html` ook gewoon direct in de browser openen.)

## Functies

- Dagpuzzel (#1 = 24 september 2026), wisselt om middernacht lokale tijd; iedereen krijgt hetzelfde woord
- Oefenmodus met willekeurige startwoorden
- Terug-knop, hints (welke letter je moet veranderen) en opgeven
- Na afloop je route naast de kortste route
- Deelbaar resultaat met 🟫/⬜-raster
- Statistieken en reeksen (opgeslagen in `localStorage`)
- Fysiek en schermtoetsenbord, dark mode, mobielvriendelijk

## Bestanden

| Bestand | Inhoud |
|---|---|
| `index.html`, `style.css`, `app.js` | Het spel |
| `words.js` | Gegenereerde woordenlijst (2789 geldige woorden, 427 startwoorden) |
| `tools/build_words.py` | Script dat `words.js` opnieuw genereert |

## Woordenlijst

- **Geldige woorden**: alle woorden van 4 letters (alleen a–z, geen hoofdletters/eigennamen) uit de
  [OpenTaal-woordenlijst](https://github.com/OpenTaal/opentaal-wordlist) (BSD / CC BY 3.0).
- **Startwoorden**: woorden uit de top-10.000 van de Nederlandse
  [FrequencyWords](https://github.com/hermitdave/FrequencyWords)-lijst (OpenSubtitles, CC BY-SA 4.0)
  die 4–6 stappen van POEP af liggen, minus een handmatige blokkeerlijst (Engels, namen, grof).
- De kortste routes worden in de browser berekend met een BFS vanaf POEP.

Opnieuw genereren (volgorde van dagpuzzels blijft gelijk dankzij een vaste seed):

```bash
python3 tools/build_words.py
```

Wil je een woord weren als startwoord, zet het dan in `BLOCK` in het script en genereer opnieuw.
Let op: dat verschuift de volgorde van toekomstige dagpuzzels.
