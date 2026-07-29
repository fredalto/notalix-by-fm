import fs from "node:fs";
import path from "node:path";

const suiteRoot = path.resolve(import.meta.dirname, "..");
const scoreDir = path.join(import.meta.dirname, "scores");
const soundDir = path.join(suiteRoot, "lecture-notes", "instrument-sounds");
fs.mkdirSync(scoreDir, { recursive: true });
fs.mkdirSync(soundDir, { recursive: true });

const instruments = {
  violon:       { name:"Violin",          sound:"strings.violin",              program:41, min:55, max:83 },
  alto:         { name:"Viola",           sound:"strings.viola",               program:42, min:48, max:74 },
  violoncelle:  { name:"Violoncello",     sound:"strings.cello",               program:43, min:36, max:67 },
  contrebasse:  { name:"Contrabass",      sound:"strings.contrabass",          program:44, min:28, max:59 },
  guitare:      { name:"Classical guitar",sound:"pluck.guitar.nylon-string",    program:25, min:40, max:67 },
  flute:        { name:"Flute",           sound:"wind.flutes.flute",           program:74, min:60, max:79 },
  hautbois:     { name:"Oboe",            sound:"wind.reed.oboe",              program:69, min:58, max:76 },
  clarinette:   { name:"Clarinet",        sound:"wind.reed.clarinet",          program:72, min:53, max:70 },
  basson:       { name:"Bassoon",         sound:"wind.reed.bassoon",           program:71, min:35, max:53 },
  saxophone:    { name:"Alto Saxophone",  sound:"wind.reed.saxophone.alto",    program:66, min:50, max:69 },
  cor:          { name:"French horn",     sound:"brass.french-horn",           program:61, min:48, max:65 },
  trompette:    { name:"Trumpet",         sound:"brass.trumpet",               program:57, min:53, max:72 },
  trombone:     { name:"Trombone",        sound:"brass.trombone",              program:58, min:35, max:55 },
  tuba:         { name:"Tuba",            sound:"brass.tuba",                  program:59, min:24, max:41 },
  accordeon:    { name:"Accordion",       sound:"keyboard.accordion",          program:22, min:36, max:72 },
  orgue:        { name:"Church organ",    sound:"keyboard.organ.pipe",         program:20, min:36, max:72 },
  clavecin:     { name:"Harpsichord",     sound:"keyboard.harpsichord",        program:7,  min:36, max:72 },
  flute_a_bec:  { name:"Recorder",        sound:"wind.flutes.recorder",        program:75, min:60, max:79 },
  chant:        { name:"Choir",           sound:"voice.choir",                 program:53, min:55, max:76 }
};

const pitchNames = [
  ["C",0],["C",1],["D",0],["D",1],["E",0],["F",0],
  ["F",1],["G",0],["G",1],["A",0],["A",1],["B",0]
];

function noteXml(midi) {
  const [step, alter] = pitchNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `<note><pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><duration>4</duration><type>quarter</type></note>`;
}

function scoreXml(spec, anchors) {
  const measures = anchors.map((midi, index) => `
    <measure number="${index + 1}">
      ${index === 0 ? `<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>3</beats><beat-type>8</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>60</per-minute></metronome></direction-type><sound tempo="60"/></direction>` : ""}
      ${noteXml(midi)}
      <note><rest/><duration>2</duration><type>eighth</type></note>
    </measure>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>${spec.name}</part-name>
      <score-instrument id="P1-I1"><instrument-name>${spec.name}</instrument-name><instrument-sound>${spec.sound}</instrument-sound></score-instrument>
      <midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>${spec.program}</midi-program><volume>82</volume><pan>0</pan></midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">${measures}
  </part>
</score-partwise>`;
}

const manifest = {};
for (const [id, spec] of Object.entries(instruments)) {
  const anchors = [];
  for (let midi = spec.min; midi <= spec.max; midi += 3) anchors.push(midi);
  if (anchors.at(-1) !== spec.max) anchors.push(spec.max);
  fs.writeFileSync(path.join(scoreDir, `${id}.musicxml`), scoreXml(spec, anchors), "utf8");
  manifest[id] = {
    file: `instrument-sounds/${id}.mp3`,
    anchors,
    segmentSeconds: 1.5,
    playableSeconds: 1.08
  };
}

fs.writeFileSync(
  path.join(soundDir, "manifest.js"),
  `window.LDN_INSTRUMENT_BANKS = ${JSON.stringify(manifest, null, 2)};\n`,
  "utf8"
);
console.log(`${Object.keys(instruments).length} banques MuseScore preparees.`);
