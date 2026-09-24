#!/usr/bin/env python3
"""Genereert words.js voor Poeple.

Bronnen:
  - OpenTaal woordenlijst  https://github.com/OpenTaal/opentaal-wordlist  (geldige woorden)
  - FrequencyWords (nl)    https://github.com/hermitdave/FrequencyWords    (bekendheid startwoorden)

Gebruik:  python3 tools/build_words.py
"""
import collections, json, os, random, urllib.request

OPENTAAL = "https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt"
FREQ = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/nl/nl_50k.txt"
TARGET = "poep"
OUT = os.path.join(os.path.dirname(__file__), "..", "words.js")

# Woorden die wel in de lijst staan maar geen leuk startwoord zijn:
# Engels, namen, grof, bijvoeglijke verbuigingen, lugubere woorden.
BLOCK = set("""
jack miss team seks shit deal show mary nick sexy date hank king sara lord fuck race gave data live
tape star long wade hall time blue fans earl wijf hope scan neuk trut geil cash gold khan game iris
rico drug unit zero gore gray yang marc pope heli tips kick like vega cape name runt zeik holt take
kids aids five back gate eden mams mara dino skip list duck face kits mans rush more card have colt
yard abel fair mimi file monk babe junk fine make milt chic mail site coke cake menu mode song link
blog nerd memo clan vice lila solo limo taco zoom hunt hans grey oven slag dode dood lijk moge amen
hete vele ware rare gene boze dure lege gele lage pure nare late kale ruwe luie vage mate hoge oude
hele rode aten erop erin eraf erom ergs mars mark wauw zult walt
""".split())


def fetch(url):
    with urllib.request.urlopen(url) as r:
        return r.read().decode("utf-8").splitlines()


def main():
    words = sorted({w for w in (l.strip() for l in fetch(OPENTAAL))
                    if len(w) == 4 and w.isascii() and w.isalpha() and w.islower()})
    ws = set(words)
    rank = {}
    for i, line in enumerate(fetch(FREQ)):
        w = line.split()[0]
        if w in ws and w not in rank:
            rank[w] = i

    def neighbours(w):
        for i in range(4):
            for c in "abcdefghijklmnopqrstuvwxyz":
                x = w[:i] + c + w[i + 1:]
                if x != w and x in ws:
                    yield x

    dist = {TARGET: 0}
    q = collections.deque([TARGET])
    while q:
        w = q.popleft()
        for x in neighbours(w):
            if x not in dist:
                dist[x] = dist[w] + 1
                q.append(x)

    starts = [w for w in words
              if 4 <= dist.get(w, 0) <= 6 and rank.get(w, 10**9) < 10000 and w not in BLOCK]
    random.seed(20260924)  # vaste volgorde: dagpuzzels veranderen niet bij herbouwen
    random.shuffle(starts)

    print(f"{len(words)} geldige woorden, {len(dist)} bereikbaar vanaf POEP, {len(starts)} startwoorden")
    print("par-verdeling startwoorden:", dict(sorted(collections.Counter(dist[w] for w in starts).items())))

    js = "// Gegenereerd door tools/build_words.py — niet handmatig bewerken.\n"
    js += "// Bron geldige woorden: OpenTaal woordenlijst (BSD/CC-BY), 4 letters, alleen a-z.\n"
    js += "window.POEPLE_WORDS = " + json.dumps(" ".join(words)) + ".split(' ');\n"
    js += "// Startwoorden: veelgebruikte woorden (FrequencyWords, OpenSubtitles) op 4-6 stappen van POEP.\n"
    js += "window.POEPLE_STARTS = " + json.dumps(" ".join(starts)) + ".split(' ');\n"
    with open(OUT, "w") as f:
        f.write(js)


if __name__ == "__main__":
    main()
