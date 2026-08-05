// --- ÉTAT global
let cleChoisie = '';
let niveauChoisi = 0;
let defiChoisi = '';

/* ============================
   Transitions d’affichage
   ============================ */
function showFadeSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  // déclenche l’animation "fade"
  requestAnimationFrame(() => el.classList.add('show'));
}
function hideAllFadeSections() {
  document.querySelectorAll('.fade').forEach(el => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 300);
  });
}

/* ============================
   Choix du mode (Clé / Instruments / Défi)
   ============================ */
function choisirMode(button, mode) {
  // visuel bouton
  document.querySelectorAll('.mode-buttons button').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');

  // reset d’état
  cleChoisie = '';
  niveauChoisi = 0;
  defiChoisi = '';
  const goBtn = document.getElementById('go-button');
  if (goBtn) goBtn.classList.add('hidden');
  const goDefi = document.getElementById('go-button-defi');
  if (goDefi) goDefi.classList.add('hidden');

  // affiche la bonne section
  hideAllFadeSections();
  setTimeout(() => showFadeSection(`etape-${mode}`), 300);
}

/* ============================
   Mode "Clé"
   ============================ */
function setCle(button, cle) {
  document.querySelectorAll('#cle-buttons button').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  cleChoisie = cle;

  // on montre la zone niveaux
  hideAllFadeSections();
  setTimeout(() => {
    showFadeSection('etape-cle');
    showFadeSection('etape-niveau');
  }, 300);
}
function selectNiveau(n) {
  document.querySelectorAll('.niveau-card').forEach(card => card.classList.remove('selected'));
  const cards = document.querySelectorAll('.niveau-card');
  if (cards[n - 1]) cards[n - 1].classList.add('selected');
  niveauChoisi = n;
  const goBtn = document.getElementById('go-button');
  if (goBtn) goBtn.classList.remove('hidden');
}
function lancerExercice() {
  if (!cleChoisie || !niveauChoisi) {
    alert("Choisis d’abord une clé et un niveau.");
    return;
  }
  const url = `${cleChoisie}_niveau${niveauChoisi}.html`;
  window.location.href = url;
}

/* ============================
   Mode "Défi"
   ============================ */
function selectDefi(el, cle) {
  document.querySelectorAll('.defi-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  defiChoisi = cle;
  const go = document.getElementById('go-button-defi');
  if (go) go.classList.remove('hidden');
}
function lancerDefiChoisi() {
  if (!defiChoisi) return;
  window.location.href = `defi_${defiChoisi}.html`;
}

/* ============================
   Mode "Instruments"
   (simplifié et calé sur les fichiers présents)
   ============================ */
let familleChoisie = '';
let sousFamilleChoisie = '';
let instrumentChoisi = '';
let niveauInstrumentChoisi = 0;
let timbreInstrumentChoisi = 'instrument';

const SOUSFAMILLES = {
  'cordes': [
    { id:'frottees', label:'Frottées' },
    { id:'pincees',  label:'Pincées'  }
  ],
  'vents': [
    { id:'bois', label:'Bois' },
    { id:'cuivres', label:'Cuivres' }
  ],
  'claviers-soufflets': [],
  'musique-ancienne': []
};

// Catalogue des disciplines enseignées, avec quatre niveaux par instrument.
const CATALOGUE = {
  'cordes': {
    'frottees': [
      { id:'violon',      label:'Violon',      actif:true  },
      { id:'alto',        label:'Alto',        actif:true  },
      { id:'violoncelle', label:'Violoncelle', actif:true  },
      { id:'contrebasse', label:'Contrebasse', actif:true }
    ],
    'pincees': [
      { id:'guitare', label:'Guitare classique', actif:true }
    ]
  },
  'vents': {
    'bois': [
      { id:'flute', label:'Flûte traversière', actif:true },
      { id:'hautbois', label:'Hautbois', actif:true },
      { id:'clarinette', label:'Clarinette', actif:true },
      { id:'basson', label:'Basson', actif:true },
      { id:'saxophone', label:'Saxophone alto', actif:true }
    ],
    'cuivres': [
      { id:'cor', label:'Cor', actif:true },
      { id:'trompette', label:'Trompette / Cornet', actif:true },
      { id:'trombone', label:'Trombone', actif:true },
      { id:'tuba', label:'Tuba', actif:true }
    ]
  },
  'claviers-soufflets': {
    'direct': [
      { id:'piano', label:'Piano', actif:true },
      { id:'orgue', label:'Orgue', actif:true },
      { id:'accordeon', label:'Accordéon', actif:true }
    ]
  },
  'musique-ancienne': {
    'direct': [
      { id:'clavecin', label:'Clavecin', actif:true },
      { id:'flute_a_bec', label:'Flûte à bec', actif:true },
      { id:'chant', label:'Chant', actif:true }
    ]
  }
};

function reopenInstrumentChoices() {
  document.getElementById('etape-instrument').classList.remove('instrument-ready');
  document.getElementById('instrument-selection-summary').classList.add('hidden-soft');
}

function changeInstrumentSelection() {
  instrumentChoisi = '';
  niveauInstrumentChoisi = 0;
  reopenInstrumentChoices();
  document.getElementById('bloc-niveaux').classList.add('hidden-soft');
  document.getElementById('instrument-launcher')?.remove();
  document.querySelectorAll('#instruments-container .tile').forEach(tile => tile.classList.remove('selected'));
  document.getElementById('bloc-instruments').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function selectFamille(famille) {
  reopenInstrumentChoices();
  familleChoisie = famille;
  sousFamilleChoisie = '';
  instrumentChoisi = '';
  const directList = (CATALOGUE[famille] || {}).direct;
  document.getElementById('bloc-sousfamilles').classList.toggle('hidden-soft', Boolean(directList));
  document.getElementById('bloc-instruments').classList.add('hidden-soft');
  document.getElementById('bloc-niveaux').classList.add('hidden-soft');

  // visuel
  document.querySelectorAll('.families-row .tile').forEach(t => t.classList.remove('selected'));
  const tile = document.querySelector(`.families-row .tile[data-famille="${famille}"]`);
  if (tile) tile.classList.add('selected');

  if (directList) {
    document.getElementById('titre-instruments').textContent = '2) Choisis un instrument';
    document.getElementById('titre-niveaux').textContent = '3) Choisis ton niveau';
    document.getElementById('bloc-instruments').classList.remove('hidden-soft');
    renderInstrumentTiles(directList);
    return;
  }

  // injecte sous-familles
  const cont = document.getElementById('sousfamilles-container');
  cont.innerHTML = '';
  (SOUSFAMILLES[famille] || []).forEach(sf => {
    const d = document.createElement('div');
    d.className = 'tile';
    d.textContent = sf.label;
    d.onclick = () => selectSousFamille(sf.id);
    cont.appendChild(d);
  });
}

function selectSousFamille(sf) {
  reopenInstrumentChoices();
  sousFamilleChoisie = sf;
  instrumentChoisi = '';
  document.getElementById('bloc-instruments').classList.remove('hidden-soft');
  document.getElementById('bloc-niveaux').classList.add('hidden-soft');
  document.getElementById('titre-instruments').textContent = '3) Choisis un instrument';
  document.getElementById('titre-niveaux').textContent = '4) Choisis ton niveau';

  // visuel
  document.querySelectorAll('#sousfamilles-container .tile').forEach(t => t.classList.remove('selected'));
  const tiles = Array.from(document.querySelectorAll('#sousfamilles-container .tile'));
  const idx = (SOUSFAMILLES[familleChoisie] || []).findIndex(x => x.id === sf);
  if (tiles[idx]) tiles[idx].classList.add('selected');

  // injecte instruments
  const liste = (CATALOGUE[familleChoisie] || {})[sf] || [];
  renderInstrumentTiles(liste);
}

function renderInstrumentTiles(liste) {
  const cont = document.getElementById('instruments-container');
  cont.innerHTML = '';
  liste.forEach(inst => {
    const d = document.createElement('div');
    d.className = 'tile' + (inst.actif ? '' : ' disabled');
    d.textContent = inst.label;
    d.dataset.instrument = inst.id;
    if (inst.actif) d.onclick = () => selectInstrument(inst.id);
    cont.appendChild(d);
  });
}

function selectInstrument(id) {
  instrumentChoisi = id;
  niveauInstrumentChoisi = 0;
  timbreInstrumentChoisi = localStorage.getItem(`ldn-timbre-${id}`) || 'instrument';
  document.getElementById('bloc-niveaux').classList.remove('hidden-soft');

  document.querySelectorAll('#instruments-container .tile').forEach(t => t.classList.remove('selected'));
  const found = document.querySelector(`#instruments-container .tile[data-instrument="${id}"]`);
  if (found) found.classList.add('selected');

  const cont = document.getElementById('levels-container');
  cont.innerHTML = '';
  document.getElementById('instrument-launcher')?.remove();
  const instrument = window.LDN_INSTRUMENTS?.[id];
  if (!instrument) return;
  document.getElementById('selected-instrument-label').textContent = instrument.label;
  document.getElementById('instrument-selection-summary').classList.remove('hidden-soft');
  document.getElementById('etape-instrument').classList.add('instrument-ready');

  instrument.levels.forEach((level, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'instrument-level-card';
    button.innerHTML = `<span class="level-number">Niveau ${index + 1}</span><strong>${level.title}</strong><small>${level.pedagogy}</small>`;
    button.addEventListener('click', () => selectInstrumentLevel(index + 1));
    cont.appendChild(button);
  });

  const launcher = document.createElement('div');
  launcher.id = 'instrument-launcher';
  launcher.className = 'instrument-launcher';
  launcher.innerHTML = `
    <div class="launcher-status" aria-live="polite"><span>Niveau</span><strong id="selected-level-label">Choisis un niveau ci-dessus</strong></div>
    <p class="launcher-title">Quel son souhaites-tu entendre ?</p>
    <div class="timbre-choice" role="group" aria-label="Choix du son">
      <button type="button" data-timbre="piano">Piano en ut</button>
      <button type="button" data-timbre="instrument">${instrument.label}</button>
    </div>
    <p class="timbre-explanation">${
      instrument.transpose
        ? `Instrument transpositeur : même avec le son Piano en ut, la hauteur entendue sera transposée comme celle du ${instrument.label}.`
        : `Instrument en ut : avec le son Piano, la hauteur entendue correspond à la note écrite.`
    }</p>
    <button type="button" id="launch-instrument-level" class="launch-instrument-level" disabled>Choisis d’abord un niveau</button>`;
  cont.after(launcher);
  launcher.querySelectorAll('[data-timbre]').forEach(button => {
    if (id === 'piano' && button.dataset.timbre === 'instrument') button.hidden = true;
    button.addEventListener('click', () => setInstrumentTimbre(button.dataset.timbre));
  });
  setInstrumentTimbre(id === 'piano' ? 'piano' : timbreInstrumentChoisi);
  launcher.querySelector('#launch-instrument-level').addEventListener('click', launchInstrumentLevel);
  document.getElementById('instrument-selection-summary').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function selectInstrumentLevel(levelNumber) {
  niveauInstrumentChoisi = levelNumber;
  document.querySelectorAll('.instrument-level-card').forEach((card, index) => {
    const selected = index + 1 === levelNumber;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  const level = window.LDN_INSTRUMENTS?.[instrumentChoisi]?.levels[levelNumber - 1];
  const label = document.getElementById('selected-level-label');
  const launchButton = document.getElementById('launch-instrument-level');
  if (label) label.textContent = `Niveau ${levelNumber} choisi — ${level?.title || ''}`;
  if (launchButton) {
    launchButton.disabled = false;
    launchButton.textContent = `Commencer le niveau ${levelNumber}`;
  }
  document.getElementById('instrument-launcher')?.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function setInstrumentTimbre(timbre) {
  timbreInstrumentChoisi = timbre;
  if (instrumentChoisi) localStorage.setItem(`ldn-timbre-${instrumentChoisi}`, timbre);
  document.querySelectorAll('#instrument-launcher [data-timbre]').forEach(button => {
    const selected = button.dataset.timbre === timbre;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
}

function launchInstrumentLevel() {
  if (!instrumentChoisi || !niveauInstrumentChoisi) return;
  const url = new URL('instrument.html', location.href);
  url.searchParams.set('instrument', instrumentChoisi);
  url.searchParams.set('niveau', String(niveauInstrumentChoisi));
  url.searchParams.set('timbre', timbreInstrumentChoisi);
  location.href = url.href;
}

/* ============================
   Accessibilité légère pour clavier
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
  // rendre les tuiles focusables
  ['.niveau-card','.defi-card','.tile','.button.level'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click?.(); }
      });
    });
  });
});

// Expose dans le scope global (nécessaire car on utilise des onClick HTML)
window.choisirMode = choisirMode;
window.setCle = setCle;
window.selectNiveau = selectNiveau;
window.lancerExercice = lancerExercice;
window.selectDefi = selectDefi;
window.lancerDefiChoisi = lancerDefiChoisi;
window.selectFamille = selectFamille;
window.selectSousFamille = selectSousFamille;
window.selectInstrument = selectInstrument;
