// Poeple-teller: bezoekers en spelgebeurtenissen via GoatCounter (gratis, zonder cookies).
//
// Er wordt niets persoonlijks verstuurd: alleen namen van gebeurtenissen zoals
// "puzzel-opgelost". Of iemand nieuw of terugkerend is, onthoudt de browser van de
// speler zelf (localStorage); alleen de uitkomst gaat naar de teller.
(() => {
  'use strict';

  // Jouw GoatCounter-code: https://<code>.goatcounter.com. Leeg = teller uit.
  const GOATCOUNTER_CODE = 'poeple';
  // Alleen tellen op de echte site, niet lokaal of in previews.
  const LIVE_HOSTS = ['jeroenip.github.io', 'poeple.nl', 'www.poeple.nl'];

  const KEY = 'poeple:teller';
  const live = GOATCOUNTER_CODE && LIVE_HOSTS.includes(location.hostname);
  const queue = [];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* privé-modus */ }
  }
  const state = load();

  function send(name) {
    if (!live) {
      if (location.hostname === 'localhost') console.debug('[teller]', name);
      return;
    }
    const gc = window.goatcounter;
    if (gc && gc.count) gc.count({ path: name, title: name, event: true });
    else queue.push(name);
  }

  // Stuur een gebeurtenis. Met `perDag` wordt hij hooguit één keer per dag per speler geteld.
  function track(name, perDag = false) {
    if (perDag) {
      const key = name + '@' + today();
      state.seen ||= {};
      if (state.seen[key]) return;
      // Alleen de afgelopen dagen onthouden.
      for (const k of Object.keys(state.seen)) if (!k.endsWith('@' + today())) delete state.seen[k];
      state.seen[key] = 1;
      save(state);
    }
    send(name);
  }

  function today() {
    const d = new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }

  // Terugkeermeting: "speler-dag-N" = speler komt terug N dagen na zijn eerste bezoek.
  // Retentie dag 1 = aantal "speler-dag-1" vandaag / aantal "speler-dag-0" gisteren.
  function countVisit() {
    if (state.first == null) { state.first = today(); save(state); }
    const n = today() - state.first;
    if ([0, 1, 2, 3, 7, 14, 30].includes(n)) track('speler-dag-' + n, true);
    if (n > 0) track('speler-terugkerend', true);
  }

  if (live) {
    // Bezoeken via een gedeeld resultaat herkent GoatCounter aan ?ref=deel.
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    s.onload = () => { while (queue.length) send(queue.shift()); };
    document.head.appendChild(s);
  }

  window.poepleTrack = track;
  countVisit();
})();
