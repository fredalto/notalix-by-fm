import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const lecture = path.join(root, "lecture-notes");
const context = { window:{} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(lecture, "instrument-config.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(lecture, "instrument-sounds", "manifest.js"), "utf8"), context);

const instruments = context.window.LDN_INSTRUMENTS;
const banks = context.window.LDN_INSTRUMENT_BANKS;
const errors = [];

for (const [id, instrument] of Object.entries(instruments)) {
  if (instrument.levels.length !== 4) errors.push(`${id}: ${instrument.levels.length} niveaux`);
  instrument.levels.forEach((level, index) => {
    if (!level.title || !level.pedagogy || !level.notes.length) errors.push(`${id} niveau ${index + 1}: contenu incomplet`);
  });
  if (id !== "piano") {
    if (!banks[id]) errors.push(`${id}: banque instrument absente`);
    else if (!fs.existsSync(path.join(lecture, banks[id].file))) errors.push(`${id}: fichier son absent`);
  }
}

const quizHtml = fs.readFileSync(path.join(lecture, "instrument.html"), "utf8");
for (const script of ["instrument-config.js", "instrument-sounds/manifest.js", "audio-engine.js", "instrument-quiz.js"]) {
  if (!quizHtml.includes(`src="${script}"`)) errors.push(`instrument.html: ${script} absent`);
}

const chordHtml = fs.readFileSync(path.join(root, "accords", "index.html"), "utf8");
if (!chordHtml.includes('src="audio-engine.js"')) errors.push("accords: moteur audio absent");

const renderedBanks = fs.readdirSync(path.join(lecture, "instrument-sounds")).filter(name => name.endsWith(".mp3"));
if (renderedBanks.length !== 19) errors.push(`banques MuseScore: ${renderedBanks.length}/19`);

class MockAudio {
  static plays = 0;
  constructor(src="") { this.src=src; this.readyState=4; this.currentTime=0; this.playbackRate=1; }
  addEventListener() {}
  load() {}
  pause() {}
  play() { MockAudio.plays++; return Promise.resolve(); }
  cloneNode() { return new MockAudio(this.src); }
}
const fileAudioContext = {
  window:{ LDN_INSTRUMENTS:instruments, LDN_INSTRUMENT_BANKS:banks },
  location:{ protocol:"file:" }, Audio:MockAudio, setTimeout, clearTimeout, console
};
vm.createContext(fileAudioContext);
vm.runInContext(fs.readFileSync(path.join(lecture, "audio-engine.js"), "utf8"), fileAudioContext);
await fileAudioContext.window.LDNAudio.preloadForLevel("contrebasse", instruments.contrebasse.levels[0], "instrument");
await fileAudioContext.window.LDNAudio.playNote(instruments.contrebasse.levels[0].notes[0], "contrebasse", "instrument");
if (!MockAudio.plays) errors.push("lecture de notes: secours audio local inactif");

const chordAudioContext = {
  window:{}, location:{ protocol:"file:" }, Audio:MockAudio, setTimeout, clearTimeout, console
};
vm.createContext(chordAudioContext);
vm.runInContext(fs.readFileSync(path.join(root, "accords", "audio-engine.js"), "utf8"), chordAudioContext);
await chordAudioContext.window.AccordsAudio.preloadAll();
const playsBeforeChord = MockAudio.plays;
await chordAudioContext.window.AccordsAudio.playBlocked([60,64,67]);
await new Promise(resolve => setTimeout(resolve, 0));
if (MockAudio.plays - playsBeforeChord !== 3) errors.push("accords: secours audio local incomplet");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes:true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const legacyPages = /(?:alto|violon|violoncelle|ut3)_niveau\d+\.html$/;
for (const htmlFile of walk(root).filter(file => file.endsWith(".html") && !legacyPages.test(file))) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const references = [...html.matchAll(/\b(?:src|href)=["']([^"'#]+)["']/g)].map(match => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|javascript:|data:)/.test(reference)) continue;
    const clean = reference.split("?")[0];
    if (!clean || clean === "/") continue;
    const target = path.resolve(path.dirname(htmlFile), clean);
    if (!fs.existsSync(target)) errors.push(`${path.relative(root, htmlFile)}: lien absent ${reference}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`${Object.keys(instruments).length} instruments, 4 niveaux chacun, 19 banques MuseScore vérifiées.`);
