# Poeple 💩

De Nederlandse versie van [Poople](https://poople.io/): een dagelijkse **woordladder** naar **POEP**.

**Speel op https://poeple.nl**

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

## Teller en statistieken

Poeple telt bezoekers en spelgebeurtenissen met [GoatCounter](https://www.goatcounter.com):
gratis, open source en zonder cookies (dus geen cookiemelding nodig). Er wordt niets persoonlijks
verstuurd, alleen namen van gebeurtenissen.

**Instellen (eenmalig):**
1. Maak een gratis account op https://www.goatcounter.com/signup met als code `poeple`
   (dan wordt je dashboard `https://poeple.goatcounter.com`). Kies je een andere code, pas dan
   `GOATCOUNTER_CODE` aan in `analytics.js`.
2. Krijgt Poeple een eigen domein, zet dat dan in `LIVE_HOSTS` in `analytics.js` en in `SITE_URL`
   in `app.js`.

Lokaal en in previews wordt niets geteld; op `localhost` zie je de gebeurtenissen in de console.

**Wat er geteld wordt:**

| Gebeurtenis | Betekenis |
|---|---|
| paginaweergave | Iemand opent de site. Via een gedeeld resultaat staat er `deel` bij de bron. |
| `speler-dag-0` | Nieuwe speler (eerste bezoek ooit) |
| `speler-dag-1`, `-2`, `-3`, `-7`, `-14`, `-30` | Speler komt terug 1, 2, 3, 7, 14 of 30 dagen na zijn eerste bezoek |
| `speler-terugkerend` | Terugkerende speler (1× per dag) |
| `dag-gestart` | Eerste woord van de dagpuzzel ingevoerd |
| `dag-opgelost`, `dag-opgelost-op-par`, `dag-opgelost-met-hint` | Dagpuzzel opgelost (en hoe) |
| `dag-opgegeven` | Dagpuzzel opgegeven |
| `dag-gedeeld` | Resultaat gedeeld |
| `dag-hint` | Hint gebruikt (elke keer) |
| `reeks-3`, `-7`, `-14`, `-30`, `-100` | Speler bereikt een reeks van zoveel dagen |
| `mdl-poeptest-klik` | Klik op de checkjepoep-test van MDL Fonds na het oplossen. MDL Fonds ziet deze bezoekers zelf ook binnenkomen met `utm_source=poeple`. |
| `oefen-gestart`, `oefen-opgelost`, `oefen-opgegeven`, `oefen-gedeeld`, `oefen-hint` | Hetzelfde voor de oefenmodus |

Gebeurtenissen met `dag-` en `speler-` tellen hooguit één keer per speler per dag.

**Belangrijkste cijfers uitrekenen** (in het dashboard, per dag):

| Cijfer | Berekening | Goed teken |
|---|---|---|
| Spelers per dag | `dag-gestart` | Groeit week op week |
| Nieuwe spelers | `speler-dag-0` | |
| Terugkomers dag 1 | `speler-dag-1` vandaag ÷ `speler-dag-0` gisteren | > 40% |
| Terugkomers dag 7 | `speler-dag-7` vandaag ÷ `speler-dag-0` 7 dagen geleden | > 20% |
| Oplospercentage | `dag-opgelost` ÷ `dag-gestart` | 70–90% |
| Deelpercentage | `dag-gedeeld` ÷ `dag-opgelost` | > 15% |
| Instroom via delen | bezoeken met bron `deel` | |

## Online zetten

De site draait op GitHub Pages (branch `main`, map `/`) met eigen domein `poeple.nl` (bestand `CNAME`).
DNS bij TransIP: `@` → A-records `185.199.108.153` t/m `185.199.111.153` en AAAA-records
`2606:50c0:8000::153` t/m `2606:50c0:8003::153`; `www` → CNAME `jeroenip.github.io.`

## Bestanden

| Bestand | Inhoud |
|---|---|
| `index.html`, `style.css`, `app.js` | Het spel |
| `analytics.js` | Teller (GoatCounter) en terugkeermeting |
| `CNAME` | Eigen domein voor GitHub Pages |
| `fonts/` | Lettertype Fredoka (SIL Open Font License) |
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
