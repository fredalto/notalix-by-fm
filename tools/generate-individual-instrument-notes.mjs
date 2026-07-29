import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const suiteRoot = path.resolve(import.meta.dirname, "..");
const lectureRoot = path.join(suiteRoot, "lecture-notes");
const scoreRoot = path.join(import.meta.dirname, "note-scores");
const soundRoot = path.join(lectureRoot, "instrument-sounds");

const specs = {
  violon:{name:"Violin",sound:"strings.violin",program:41}, alto:{name:"Viola",sound:"strings.viola",program:42},
  violoncelle:{name:"Violoncello",sound:"strings.cello",program:43}, contrebasse:{name:"Contrabass",sound:"strings.contrabass",program:44},
  guitare:{name:"Classical guitar",sound:"pluck.guitar.nylon-string",program:25}, flute:{name:"Flute",sound:"wind.flutes.flute",program:74},
  hautbois:{name:"Oboe",sound:"wind.reed.oboe",program:69}, clarinette:{name:"Clarinet",sound:"wind.reed.clarinet",program:72},
  basson:{name:"Bassoon",sound:"wind.reed.bassoon",program:71}, saxophone:{name:"Alto Saxophone",sound:"wind.reed.saxophone.alto",program:66},
  cor:{name:"French horn",sound:"brass.french-horn",program:61}, trompette:{name:"Trumpet",sound:"brass.trumpet",program:57},
  trombone:{name:"Trombone",sound:"brass.trombone",program:58}, tuba:{name:"Tuba",sound:"brass.tuba",program:59},
  accordeon:{name:"Accordion",sound:"keyboard.accordion",program:22}, orgue:{name:"Church organ",sound:"keyboard.organ.pipe",program:20},
  clavecin:{name:"Harpsichord",sound:"keyboard.harpsichord",program:7}, flute_a_bec:{name:"Recorder",sound:"wind.flutes.recorder",program:75},
  chant:{name:"Choir",sound:"voice.choir",program:53}
};

const configContext = { window:{} };
vm.createContext(configContext);
vm.runInContext(fs.readFileSync(path.join(lectureRoot, "instrument-config.js"), "utf8"), configContext);

const pitchNames = [["C",0],["C",1],["D",0],["D",1],["E",0],["F",0],["F",1],["G",0],["G",1],["A",0],["A",1],["B",0]];
function midi(code) {
  const match = /^([A-G])(sharp|flat|#|b)?(-?\d+)$/.exec(code);
  let pitch = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1]];
  if (match[2] === "sharp" || match[2] === "#") pitch++;
  if (match[2] === "flat" || match[2] === "b") pitch--;
  return (Number(match[3]) + 1) * 12 + pitch;
}

function scoreXml(spec, midiValue) {
  const [step, alter] = pitchNames[(midiValue % 12 + 12) % 12];
  const octave = Math.floor(midiValue / 12) - 1;
  const clef = midiValue < 55 ? '<clef><sign>F</sign><line>4</line></clef>' : '<clef><sign>G</sign><line>2</line></clef>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><part-list><score-part id="P1"><part-name>${spec.name}</part-name>
<score-instrument id="P1-I1"><instrument-name>${spec.name}</instrument-name><instrument-sound>${spec.sound}</instrument-sound></score-instrument>
<midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>${spec.program}</midi-program><volume>82</volume><pan>0</pan></midi-instrument>
</score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time>${clef}</attributes>
<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>90</per-minute></metronome></direction-type><sound tempo="90"/></direction>
<note><pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><duration>8</duration><type>half</type></note>
<note><rest/><duration>4</duration><type>quarter</type></note></measure></part></score-partwise>`;
}

const manifest = {};
const renderJobs = [];
let total = 0;
for (const [id, spec] of Object.entries(specs)) {
  const instrument = configContext.window.LDN_INSTRUMENTS[id];
  const notes = [...new Set(instrument.levels.flatMap(level => level.notes.map(note => midi(note.written) + (instrument.transpose || 0))))].sort((a,b)=>a-b);
  const scoreDir = path.join(scoreRoot, id);
  const outputDir = path.join(soundRoot, id);
  fs.mkdirSync(scoreDir, { recursive:true });
  fs.mkdirSync(outputDir, { recursive:true });
  manifest[id] = { notes:{} };
  for (const midiValue of notes) {
    const scoreFile = path.join(scoreDir, `${midiValue}.musicxml`);
    const outputFile = path.join(outputDir, `${midiValue}.mp3`);
    fs.writeFileSync(scoreFile, scoreXml(spec, midiValue), "utf8");
    manifest[id].notes[midiValue] = `instrument-sounds/${id}/${midiValue}.mp3`;
    renderJobs.push({ in:scoreFile, out:outputFile });
    total++;
  }
}

fs.writeFileSync(path.join(soundRoot, "manifest.js"), `window.LDN_INSTRUMENT_BANKS = ${JSON.stringify(manifest, null, 2)};\n`, "utf8");
fs.writeFileSync(path.join(import.meta.dirname, "render-individual-notes.json"), `${JSON.stringify(renderJobs, null, 2)}\n`, "utf8");
console.log(`${total} notes individuelles préparées pour ${Object.keys(specs).length} instruments.`);
