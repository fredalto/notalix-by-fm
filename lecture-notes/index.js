// --- ÉTAT global
let clesChoisies = [];
let niveauChoisi = 0;
let defiChoisi = '';

function scrollToStep(element) {
  if (!element || !matchMedia('(max-width: 760px)').matches) return;
  requestAnimationFrame(() => setTimeout(() => element.scrollIntoView({ behavior:'smooth', block:'start' }), 40));
}

const KEY_CONTEXTS = {
  sol: '<strong>Clé de Sol</strong><span>Indispensable au violon et à de nombreux instruments aigus. Elle sert aussi à la main droite des claviers et aide à lire une partition d’ensemble.</span>',
  fa: '<strong>Clé de Fa</strong><span>Indispensable aux instruments graves, à la main gauche des claviers et notamment aux timbales. Elle permet aussi de comprendre la basse et les fondations harmoniques d’une partition.</span>',
  ut3: '<strong>Clé d’Ut 3e</strong><span>C’est la clé habituelle de l’alto : un altiste doit la lire directement, sans transposer mentalement depuis la clé de Sol.</span>',
  ut4: '<strong>Clé d’Ut 4e</strong><span>Elle permet au violoncelle, au basson et au trombone de lire leur registre aigu avec moins de lignes supplémentaires.</span>',
  ut1: '<strong>Clé d’Ut 1re</strong><span>Ancienne clé de soprano, utile pour certains répertoires, l’analyse, la lecture de partitions anciennes et la culture générale du musicien.</span>',
  ut2: '<strong>Clé d’Ut 2e</strong><span>Ancienne clé de mezzo-soprano, rencontrée dans des partitions anciennes. Elle aide à comprendre l’histoire de la notation et les différents registres vocaux.</span>'
};

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
  window.scrollTo(0, 0);
  // visuel bouton
  document.querySelectorAll('.mode-buttons button').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');

  // reset d’état
  clesChoisies = [];
  niveauChoisi = 0;
  defiChoisi = '';
  const goBtn = document.getElementById('go-button');
  if (goBtn) { goBtn.classList.remove('hidden'); goBtn.disabled = true; goBtn.textContent = 'Choisis d’abord un niveau'; }
  const goDefi = document.getElementById('go-button-defi');
  if (goDefi) goDefi.classList.add('hidden');
  if (mode === 'instrument') resetInstrumentSelection();

  // affiche la bonne section
  hideAllFadeSections();
  setTimeout(() => {
    showFadeSection(`etape-${mode}`);
  }, 300);
}

/* ============================
   Mode "Clé"
   ============================ */
function setCle(button, cle) {
  const wasSelected = clesChoisies.includes(cle);
  clesChoisies = wasSelected ? clesChoisies.filter(id => id !== cle) : [...clesChoisies, cle];
  button.classList.toggle('selected', !wasSelected);
  button.setAttribute('aria-pressed', wasSelected ? 'false' : 'true');
  niveauChoisi = 0;
  document.querySelectorAll('#key-stages .instrument-level-card').forEach(card => card.classList.remove('selected'));
  updateCompatibleKeyLevels();
  document.getElementById('key-stages')?.classList.toggle('hidden-soft', clesChoisies.length === 0);
  updateKeyContext();
  const go = document.getElementById('go-button');
  if (go) { go.disabled = true; go.textContent = 'Choisis d’abord un niveau'; }
  if (clesChoisies.length) scrollToStep(document.getElementById('key-stages'));
}
function updateCompatibleKeyLevels() {
  const selectedConfigs = clesChoisies.map(id => window.LDN_CLEFS?.[id]).filter(Boolean);
  const commonLevelCount = selectedConfigs.length
    ? Math.min(...selectedConfigs.map(config => config.stages?.length || 0))
    : 0;
  document.querySelectorAll('#key-stages .instrument-level-card').forEach((card, index) => {
    const compatible = index < commonLevelCount;
    card.hidden = !compatible;
    card.disabled = !compatible;
  });
}
function selectNiveau(n) {
  niveauChoisi = n;
  document.querySelectorAll('#key-stages .instrument-level-card').forEach((card,index) => card.classList.toggle('selected', index === n - 1));
  const go = document.getElementById('go-button');
  if (go) { go.disabled = false; go.textContent = `Commencer le niveau ${n}`; }
  updateKeyContext();
  scrollToStep(go);
}
function backToKeyChoice() {
  clesChoisies = [];
  niveauChoisi = 0;
  document.getElementById('key-stages')?.classList.add('hidden-soft');
  document.getElementById('cle-buttons')?.classList.remove('hidden-soft');
  document.querySelector('#etape-cle .key-purpose-intro')?.classList.remove('hidden-soft');
  const title = document.getElementById('key-choice-title');
  if (title) title.textContent = 'Choisis ta clé';
  document.querySelectorAll('#cle-buttons button').forEach(btn => { btn.classList.remove('selected'); btn.setAttribute('aria-pressed','false'); });
}
const NOTE_LABELS = {C:'Do',D:'Ré',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Si'};
function updateKeyContext() {
  const context = document.getElementById('key-context');
  if (!context) return;
  if (!clesChoisies.length) { context.classList.add('hidden-soft'); context.replaceChildren(); return; }
  const names = clesChoisies.map(id => window.LDN_CLEFS[id]?.label).filter(Boolean);
  let html = `<strong>${clesChoisies.length > 1 ? 'Clés choisies' : 'Clé choisie'} : ${names.join(' + ')}</strong>`;
  if (niveauChoisi) {
    const newNames = new Set();
    clesChoisies.forEach(id => window.LDN_CLEFS[id]?.stages[niveauChoisi-1]?.focus?.forEach(note => newNames.add(NOTE_LABELS[note.written[0]])));
    html += `<span>Niveau ${niveauChoisi} · ${newNames.size ? `Nouvelles notes : ${[...newNames].join(', ')}` : 'Consolidation des notes déjà apprises'}</span>`;
  } else html += '<span>Tu peux en choisir plusieurs, puis sélectionner un niveau.</span>';
  context.innerHTML = html;
  context.classList.remove('hidden-soft');
}
function lancerExercice() {
  if (!clesChoisies.length || !niveauChoisi) {
    alert("Choisis d’abord une clé et un niveau.");
    return;
  }
  const url = new URL('cle-exercise.html', location.href);
  url.searchParams.set('cles', clesChoisies.join(','));
  url.searchParams.set('etape', String(niveauChoisi));
  location.href = url.href;
}

/* ============================
   Mode "Défi"
   ============================ */
function selectDefi(el, cle) {
  defiChoisi = cle;
  lancerDefiChoisi();
}
function lancerDefiChoisi() {
  if (!defiChoisi) return;
  const url = new URL('cle-exercise.html', location.href);
  url.searchParams.set('defi', defiChoisi);
  location.href = url.href;
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
  'musique-ancienne': [],
  'musique-traditionnelle': [],
  'musiques-actuelles-jazz': []
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
      { id:'violoncelle_baroque', label:'Violoncelle baroque', actif:true }
    ]
  },
  'musique-traditionnelle': {
    'direct': [
      { id:'cornemuse', label:'Cornemuse 16 pouces', actif:true },
      { id:'violon_traditionnel', label:'Violon traditionnel', actif:true }
    ]
  },
  'musiques-actuelles-jazz': {
    'direct': [
      { id:'guitare_actuelle', label:'Guitare', actif:true },
      { id:'piano', label:'Piano', actif:true },
      { id:'contrebasse', label:'Contrebasse', actif:true },
      { id:'basse_electrique', label:'Basse électrique', actif:true }
    ]
  }
};

const FAMILY_LABELS = {
  cordes:'Cordes',
  vents:'Vents',
  'claviers-soufflets':'Claviers',
  'musique-ancienne':'Musique ancienne',
  'musique-traditionnelle':'Musique traditionnelle',
  'musiques-actuelles-jazz':'Musiques actuelles et jazz'
};
const TRANSPOSITION_INFO = {
  clarinette:'Une seconde majeure plus bas (un ton) · Do écrit → Si♭ entendu',
  trompette:'Une seconde majeure plus bas (un ton) · Do écrit → Si♭ entendu',
  saxophone:'Une sixte majeure plus bas · Do écrit → Mi♭ entendu',
  cor:'Une quinte juste plus bas · Do écrit → Fa entendu',
  guitare:'Une octave plus bas · Do écrit → Do entendu à l’octave inférieure',
  contrebasse:'Une octave plus bas · Do écrit → Do entendu à l’octave inférieure',
  guitare_actuelle:'Une octave plus bas · Do écrit → Do entendu à l’octave inférieure',
  contrebasse_basse:'Une octave plus bas · Do écrit → Do entendu à l’octave inférieure',
  basse_electrique:'Une octave plus bas · Do écrit → Do entendu à l’octave inférieure'
};
const PIANO_BY_DEFAULT = new Set(['clarinette','trompette','saxophone','cor']);

function reopenInstrumentChoices() {
  document.getElementById('etape-instrument').classList.remove('instrument-ready');
  document.getElementById('instrument-selection-summary').classList.add('hidden-soft');
  document.getElementById('instrument-section-title').textContent = 'Choisis ton instrument';
}

function resetInstrumentSelection() {
  instrumentChoisi = '';
  niveauInstrumentChoisi = 0;
  reopenInstrumentChoices();
  document.getElementById('bloc-niveaux')?.classList.add('hidden-soft');
  document.getElementById('bloc-sousfamilles')?.classList.add('hidden-soft');
  document.getElementById('bloc-instruments')?.classList.add('hidden-soft');
  document.getElementById('instrument-launcher')?.remove();
  document.querySelectorAll('.families-row .tile').forEach(tile => tile.classList.remove('selected'));
}

function changeInstrumentSelection() {
  resetInstrumentSelection();
  document.getElementById('etape-instrument').scrollIntoView({ behavior:'smooth', block:'start' });
}

function selectFamille(famille) {
  reopenInstrumentChoices();
  familleChoisie = famille;
  instrumentChoisi = '';
  document.getElementById('bloc-niveaux').classList.add('hidden-soft');
  document.getElementById('bloc-instruments').classList.add('hidden-soft');
  document.querySelectorAll('.families-row .tile').forEach(t => t.classList.remove('selected'));
  const tile = document.querySelector(`.families-row .tile[data-famille="${famille}"]`);
  if (tile) tile.classList.add('selected');
  const direct = (CATALOGUE[famille] || {}).direct;
  document.getElementById('bloc-sousfamilles').classList.toggle('hidden-soft', Boolean(direct));
  if (direct) {
    document.getElementById('bloc-instruments').classList.remove('hidden-soft');
    document.getElementById('titre-instruments').textContent = FAMILY_LABELS[famille] || 'Instruments';
    renderInstrumentTiles(direct);
    scrollToStep(document.getElementById('bloc-instruments'));
    return;
  }
  const container = document.getElementById('sousfamilles-container');
  container.replaceChildren();
  (SOUSFAMILLES[famille] || []).forEach(subfamily => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile subfamily-tile';
    button.textContent = subfamily.label;
    button.addEventListener('click', () => selectSousFamille(subfamily.id, button));
    container.appendChild(button);
  });
  scrollToStep(document.getElementById('bloc-sousfamilles'));
}

function selectSousFamille(sf, selectedButton) {
  const list = (CATALOGUE[familleChoisie] || {})[sf] || [];
  document.querySelectorAll('#sousfamilles-container .tile').forEach(tile => tile.classList.remove('selected'));
  selectedButton?.classList.add('selected');
  document.getElementById('bloc-instruments').classList.remove('hidden-soft');
  document.getElementById('titre-instruments').textContent = sf === 'bois' ? 'Bois' : sf === 'cuivres' ? 'Cuivres' : sf === 'frottees' ? 'Cordes frottées' : 'Cordes pincées';
  renderInstrumentTiles(list);
  scrollToStep(document.getElementById('bloc-instruments'));
}

function renderInstrumentTiles(liste) {
  const cont = document.getElementById('instruments-container');
  cont.innerHTML = '';
  liste.forEach(inst => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'tile' + (inst.actif ? '' : ' disabled');
    d.innerHTML = `<span>${inst.label}</span>${inst.status ? `<small>${inst.status}</small>` : ''}`;
    d.dataset.instrument = inst.id;
    d.disabled = !inst.actif;
    if (inst.actif) d.onclick = () => selectInstrument(inst.id);
    cont.appendChild(d);
  });
}

function selectInstrument(id) {
  instrumentChoisi = id;
  niveauInstrumentChoisi = 0;
  const preliminaryInstrument = window.LDN_INSTRUMENTS?.[id];
  timbreInstrumentChoisi = PIANO_BY_DEFAULT.has(id) || preliminaryInstrument?.forcePiano ? 'piano' : 'instrument';
  document.getElementById('bloc-niveaux').classList.remove('hidden-soft');
  document.getElementById('bloc-niveaux').classList.add('awaiting-level');
  document.getElementById('titre-niveaux').textContent = 'Choisis ta mission !';

  document.querySelectorAll('#instruments-container .tile').forEach(t => t.classList.remove('selected'));
  const found = document.querySelector(`#instruments-container .tile[data-instrument="${id}"]`);
  if (found) found.classList.add('selected');

  const cont = document.getElementById('levels-container');
  cont.innerHTML = '';
  document.getElementById('instrument-launcher')?.remove();
  const instrument = window.LDN_INSTRUMENTS?.[id];
  if (!instrument) return;
  document.getElementById('instrument-section-title').textContent = instrument.label;
  document.getElementById('instrument-selection-summary').classList.remove('hidden-soft');
  document.getElementById('etape-instrument').classList.add('instrument-ready');

  instrument.levels.forEach((level, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'instrument-level-card';
    button.innerHTML = `<span class="level-number">${index + 1}</span><strong>${level.title}</strong><small>${level.pedagogy}</small><span class="level-action">Jouer <b>▶</b></span>`;
    button.addEventListener('click', () => selectInstrumentLevel(index + 1));
    cont.appendChild(button);
  });

  scrollToStep(document.getElementById('bloc-niveaux'));
}

function selectInstrumentLevel(levelNumber) {
  niveauInstrumentChoisi = levelNumber;
  launchInstrumentLevel();
}

function setInstrumentTimbre(timbre) {
  timbreInstrumentChoisi = timbre;
  document.querySelectorAll('#instrument-launcher [data-timbre]').forEach(button => {
    const selected = button.dataset.timbre === timbre;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  const explanation = document.getElementById('timbre-explanation');
  if (explanation) {
    explanation.textContent = timbre === 'piano'
      ? 'Piano en ut : la hauteur entendue correspond à la note écrite.'
      : (TRANSPOSITION_INFO[instrumentChoisi] || 'Le son entendu correspond à la hauteur de l’instrument.');
  }
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
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  document.querySelectorAll('[data-tutorial-open]').forEach(button => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.tutorialOpen);
      if (!dialog) return;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });
  document.querySelectorAll('.tutorial-dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-tutorial-close]').forEach(button => {
      button.addEventListener('click', () => {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });
  });
  const requestedMode = new URLSearchParams(location.search).get('mode');
  const requestedButton = ['cle', 'instrument', 'defi'].includes(requestedMode)
    ? document.getElementById(`btn-${requestedMode}`)
    : null;
  if (requestedButton) choisirMode(requestedButton, requestedMode);
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
window.backToKeyChoice = backToKeyChoice;
window.lancerExercice = lancerExercice;
window.selectDefi = selectDefi;
window.lancerDefiChoisi = lancerDefiChoisi;
window.selectFamille = selectFamille;
window.selectSousFamille = selectSousFamille;
window.selectInstrument = selectInstrument;
