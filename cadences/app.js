const $ = selector => document.querySelector(selector);
const screens = [...document.querySelectorAll('.screen')];
const cadences = {
  perfect: { name: 'Cadence parfaite', degrees: ['V', 'I'], path: ['I', 'IV', 'V', 'I'], description: 'La dominante se résout sur la tonique. C’est la conclusion la plus nette et la plus stable.' },
  half: { name: 'Demi-cadence', degrees: ['I', 'V'], path: ['I', 'IV', 'I', 'V'], description: 'La phrase s’arrête sur la dominante. Elle reste ouverte et donne envie de continuer.' },
  deceptive: { name: 'Cadence rompue', degrees: ['V', 'VI'], path: ['I', 'IV', 'V', 'VI'], description: 'La dominante évite la tonique et se dirige vers le sixième degré. La résolution attendue est surprise.' },
  plagal: { name: 'Cadence plagale', degrees: ['IV', 'I'], path: ['I', 'V', 'IV', 'I'], description: 'La sous-dominante rejoint la tonique. La conclusion est plus douce que la cadence parfaite.' }
};
const cadenceOrder = ['perfect', 'half', 'deceptive', 'plagal'];
const keys = [{ name: 'Do majeur', tonic: 60 }, { name: 'Ré majeur', tonic: 62 }, { name: 'Fa majeur', tonic: 65 }, { name: 'Sol majeur', tonic: 67 }];
const sampleNames = ['C', 'Csharp', 'D', 'Dsharp', 'E', 'F', 'Fsharp', 'G', 'Gsharp', 'A', 'Asharp', 'B'];
const naturalPc = [0, 2, 4, 5, 7, 9, 11];
let selected = [], sequence = [], q = 0, score = 0, current = null, currentKey = keys[0], timers = [];

function go(id) { screens.forEach(screen => screen.classList.toggle('show', screen.id === id)); }
document.querySelectorAll('#directChoice input').forEach(input => { input.onchange = updateSelection; });
function updateSelection() {
  selected = [...document.querySelectorAll('#directChoice input:checked')].map(input => input.value);
  const enough = selected.length >= 2;
  $('#start').disabled = !enough;
  $('#selectionStatus').textContent = enough ? `${selected.length} cadences sélectionnées` : 'Choisis encore une cadence pour commencer';
  $('#selectionStatus').classList.toggle('warning', !enough);
}
updateSelection();
$('#openTuto').onclick = () => { renderTutorial(); go('tuto'); };
$('#tutoBack').onclick = () => go('home');
$('#start').onclick = start;
$('#back').onclick = () => go('home');
$('#homeBtn').onclick = () => go('home');
$('#again').onclick = start;
$('#next').onclick = next;
$('#play').onclick = playCurrent;
$('#replayExample').onclick = playCurrent;

function chord(degree, tonic) {
  const definitions = { I: [0, 'M', 0], IV: [5, 'M', 3], V: [7, 'M', 4], VI: [9, 'm', 5] };
  const [offset, quality, scaleStep] = definitions[degree];
  const tonicLetter = naturalPc.indexOf(tonic % 12);
  return { root: tonic + offset, rootLetter: (tonicLetter + scaleStep) % 7, intervals: quality === 'M' ? [0, 4, 7] : [0, 3, 7], degree };
}
function progression(type, tonic) { return cadences[type].path.map(degree => chord(degree, tonic)); }
function sampleFile(midi) { return `sounds/${sampleNames[midi % 12]}${Math.floor(midi / 12) - 1}.mp3`; }
function playNote(midi, delay, volume) {
  const startNote = () => {
    const audio = new Audio(sampleFile(midi));
    audio.volume = volume;
    audio.play().catch(() => {});
  };
  if (delay) timers.push(setTimeout(startNote, delay)); else startNote();
}
function playCadence(type, tonic) {
  timers.forEach(clearTimeout);
  timers = [];
  const starts = [0, 850, 1800, 2950];
  progression(type, tonic).forEach((currentChord, chordIndex) => {
    const delay = starts[chordIndex];
    playNote(currentChord.root - 12, delay, 0.82);
    currentChord.intervals.forEach(interval => playNote(currentChord.root + interval, delay, 0.56));
  });
}
function playCurrent() { playCadence(current, currentKey.tonic); }
function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function hasTriple(values) { return values.some((value, index) => index > 1 && value === values[index - 1] && value === values[index - 2]); }
function strictAlternation(values) { return values.length > 2 && values.every((value, index) => index === 0 || value !== values[index - 1]); }
function buildSequence() {
  const pool = Array.from({ length: 10 }, (_, index) => selected[index % selected.length]);
  for (let attempt = 0; attempt < 500; attempt++) {
    const candidate = shuffle(pool);
    if (!hasTriple(candidate) && !(selected.length === 2 && strictAlternation(candidate))) return candidate;
  }
  return pool;
}
function start() { q = 0; score = 0; sequence = buildSequence(); go('game'); next(); }
function next() {
  if (q >= 10) { finish(); return; }
  q++;
  current = sequence[q - 1];
  currentKey = keys[Math.floor(Math.random() * keys.length)];
  $('#count').textContent = `Question ${q}/10`;
  $('#score').textContent = `Score ${score}`;
  $('#bar').style.width = `${(q - 1) * 10}%`;
  $('#feedback').textContent = '';
  $('#feedback').className = 'feedback';
  $('#visualAnswer').classList.add('hidden');
  $('#next').classList.add('hidden');
  $('#answers').innerHTML = '';
  selected.forEach(id => {
    const button = document.createElement('button');
    button.textContent = cadences[id].name;
    button.onclick = () => answer(id, button);
    $('#answers').append(button);
  });
  playCurrent();
}
function answer(id, button) {
  [...$('#answers').children].forEach(answerButton => { answerButton.disabled = true; });
  const correct = id === current;
  if (correct) score++;
  button.style.background = correct ? '#2e7d32' : '#d32f2f';
  $('#feedback').textContent = correct ? 'Bravo ! Bonne direction harmonique 🎉' : `Presque ! C’était une ${cadences[current].name.toLowerCase()}.`;
  $('#feedback').classList.add(correct ? 'ok' : 'no');
  $('#score').textContent = `Score ${score}`;
  $('#bar').style.width = `${q * 10}%`;
  showVisual();
  $('#next').classList.remove('hidden');
}
function renderTutorial() {
  $('#tutoNav').innerHTML = cadenceOrder.map(id => `<button data-tutorial="${id}">${cadences[id].name}</button>`).join('');
  document.querySelectorAll('[data-tutorial]').forEach(button => { button.onclick = () => selectTutorial(button.dataset.tutorial); });
  selectTutorial('perfect');
}
function selectTutorial(id) {
  document.querySelectorAll('[data-tutorial]').forEach(button => button.classList.toggle('selected', button.dataset.tutorial === id));
  const selectedCadence = cadences[id];
  $('#tutoDetail').innerHTML = `<h3>${selectedCadence.name}</h3><p class="explanation">${selectedCadence.description}</p><div id="tutoNotation" class="notation"></div>${pathMarkup(selectedCadence.path)}<div class="cadence-focus">CADENCE : ${selectedCadence.degrees[0]} → ${selectedCadence.degrees[1]}</div><div class="tonality">Exemple en Do majeur</div><div class="listening"><button id="tutoPlay">▶ Écouter l’exemple</button></div>`;
  renderProgression($('#tutoNotation'), progression(id, 60));
  $('#tutoPlay').onclick = () => playCadence(id, 60);
}
function pathMarkup(path) {
  return `<div class="harmonic-path">${path.map((degree, index) => `<span class="${index >= 2 ? 'cadential' : 'preparation'}">${degree}</span>`).join('<b class="path-arrow">→</b>')}</div>`;
}
function showVisual() {
  const selectedCadence = cadences[current];
  $('#cadenceName').textContent = selectedCadence.name;
  renderProgression($('#gameNotation'), progression(current, currentKey.tonic));
  $('#gameDegrees').innerHTML = pathMarkup(selectedCadence.path);
  $('#gameTonality').innerHTML = `<div class="cadence-focus">CADENCE : ${selectedCadence.degrees[0]} → ${selectedCadence.degrees[1]}</div><div>${currentKey.name}</div>`;
  $('#visualAnswer').classList.remove('hidden');
}
function spellTriad(currentChord) {
  const rootLetter = currentChord.rootLetter;
  const rootOctave = Math.floor(currentChord.root / 12) - 1;
  return currentChord.intervals.map((interval, index) => {
    const rawLetter = rootLetter + index * 2, letterIndex = rawLetter % 7;
    const octave = rootOctave + Math.floor(rawLetter / 7);
    const naturalMidi = (octave + 1) * 12 + naturalPc[letterIndex], target = currentChord.root + interval;
    let delta = target - naturalMidi;
    while (delta > 6) delta -= 12;
    while (delta < -6) delta += 12;
    const accidental = delta === 1 ? '#' : delta === -1 ? 'b' : delta === 2 ? '##' : delta === -2 ? 'bb' : '';
    return { letterIndex, octave, accidental };
  });
}
function renderProgression(target, chords) {
  target.innerHTML = '';
  const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = window.VexFlow;
  const width = Math.max(340, Math.min(700, target.clientWidth || 650)), height = 190;
  const renderer = new Renderer(target, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext(), stave = new Stave(12, 28, width - 24);
  stave.addClef('treble').setContext(context).draw();
  const noteLetters = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
  const notes = chords.map((currentChord, chordIndex) => {
    const spelled = spellTriad(currentChord);
    const note = new StaveNote({ clef: 'treble', keys: spelled.map(item => `${noteLetters[item.letterIndex]}/${item.octave}`), duration: 'q' });
    note.setStyle(chordIndex >= 2 ? { fillStyle: '#1565c0', strokeStyle: '#1565c0' } : { fillStyle: '#8b98a8', strokeStyle: '#8b98a8' });
    spelled.forEach((item, noteIndex) => { if (item.accidental) note.addModifier(new Accidental(item.accidental), noteIndex); });
    return note;
  });
  const voice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables(notes);
  new Formatter().joinVoices([voice]).format([voice], width - 150);
  voice.draw(context, stave);
}
function finish() {
  go('results');
  $('#result').textContent = `${score}/10`;
  $('#message').textContent = score >= 8 ? 'Excellent, les cadences sont bien reconnues !' : score >= 5 ? 'Bien joué ! Reprends les exemples pour consolider les fins de phrase.' : 'Commence avec deux cadences et concentre-toi sur les deux derniers accords.';
}
