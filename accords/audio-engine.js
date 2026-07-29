(function () {
  "use strict";

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const context = AudioContextClass ? new AudioContextClass() : null;
  const names = ["C","Csharp","D","Dsharp","E","F","Fsharp","G","Gsharp","A","Asharp","B"];
  const available = [
    "A1","A2","A3","A4","A5","Asharp3","Asharp4",
    "B1","B2","B3","B4","B5",
    "C1","C2","C3","C4","C5","C6","Csharp4","Csharp5",
    "D1","D2","D3","D4","D5","D6","Dsharp3","Dsharp4","Dsharp5",
    "E1","E2","E3","E4","E5","E6",
    "F1","F2","F3","F4","F5","Fsharp3","Fsharp4","Fsharp5",
    "G1","G2","G3","G4","G5","Gsharp3","Gsharp4","Gsharp5"
  ];
  const buffers = new Map();
  const htmlAudio = new Map();
  const useFileFallback = location.protocol === "file:";
  const activeSources = new Set();
  const activeHtmlAudio = new Set();

  function midi(code) {
    const match = /^([A-G])(sharp)?(\d+)$/.exec(code);
    const semitone = names.indexOf(match[1] + (match[2] || ""));
    return (Number(match[3]) + 1) * 12 + semitone;
  }

  const samples = available.map(code => ({ code, midi:midi(code) }));

  function nearestSample(targetMidi) {
    return samples.reduce((best, sample) =>
      Math.abs(sample.midi - targetMidi) < Math.abs(best.midi - targetMidi) ? sample : best
    );
  }

  async function load(url) {
    if (!context) throw new Error("Audio Web non disponible");
    if (!buffers.has(url)) {
      buffers.set(url, fetch(url)
        .then(response => {
          if (!response.ok) throw new Error(`Son introuvable : ${url}`);
          return response.arrayBuffer();
        })
        .then(data => context.decodeAudioData(data)));
    }
    return buffers.get(url);
  }

  function loadHtml(url) {
    if (!htmlAudio.has(url)) {
      const audio = new Audio(url);
      audio.preload = "auto";
      htmlAudio.set(url, new Promise(resolve => {
        if (audio.readyState >= 2) return resolve(audio);
        const done = () => resolve(audio);
        audio.addEventListener("canplay", done, { once:true });
        audio.addEventListener("error", done, { once:true });
        setTimeout(done, 2500);
        audio.load();
      }));
    }
    return htmlAudio.get(url);
  }

  async function preloadAll(onProgress) {
    let done = 0;
    await Promise.all(available.map(async code => {
      if (useFileFallback) await loadHtml(`sounds/${code}.mp3`);
      else await load(`sounds/${code}.mp3`);
      done++;
      onProgress?.(done / available.length);
    }));
  }

  async function resume() {
    if (context?.state === "suspended") await context.resume();
  }

  function stopAll() {
    activeSources.forEach(source => {
      try { source.stop(); } catch (_) {}
    });
    activeSources.clear();
    activeHtmlAudio.forEach(audio => audio.pause());
    activeHtmlAudio.clear();
  }

  async function playHtml(midis, arpeggio) {
    stopAll();
    const prepared = await Promise.all(midis.map(async targetMidi => {
      const sample = nearestSample(targetMidi);
      const template = await loadHtml(`sounds/${sample.code}.mp3`);
      const audio = template.cloneNode(true);
      audio.volume = arpeggio ? .72 : .58;
      audio.playbackRate = Math.pow(2, (targetMidi - sample.midi) / 12);
      audio.preservesPitch = false;
      activeHtmlAudio.add(audio);
      return audio;
    }));
    prepared.forEach((audio, index) => {
      if (arpeggio) setTimeout(() => audio.play().catch(() => {}), index * 230);
      else audio.play().catch(() => {});
    });
  }

  async function scheduleNote(targetMidi, when, volume) {
    const sample = nearestSample(targetMidi);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = await load(`sounds/${sample.code}.mp3`);
    source.playbackRate.value = Math.pow(2, (targetMidi - sample.midi) / 12);
    gain.gain.value = volume;
    source.connect(gain).connect(context.destination);
    source.start(when);
    activeSources.add(source);
    source.onended = () => activeSources.delete(source);
  }

  async function play(midis, arpeggio) {
    if (useFileFallback || !context) return playHtml(midis, arpeggio);
    await resume();
    stopAll();
    const start = context.currentTime + .06;
    await Promise.all(midis.map((midiValue, index) =>
      scheduleNote(midiValue, start + (arpeggio ? index * .23 : 0), arpeggio ? .72 : .58)
    ));
  }

  window.AccordsAudio = Object.freeze({
    preloadAll,
    playBlocked(midis) { return play(midis, false); },
    playArpeggio(midis) { return play(midis, true); },
    resume
  });
}());
