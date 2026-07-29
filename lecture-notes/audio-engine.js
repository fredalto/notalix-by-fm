(function () {
  "use strict";

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const context = AudioContextClass ? new AudioContextClass() : null;
  const buffers = new Map();
  const htmlAudio = new Map();
  const useFileFallback = location.protocol === "file:";
  let activeSource = null;
  let activeHtmlAudio = null;
  let activeHtmlTimer = null;

  const pianoSamples = [
    "A1","A2","A3","A4","A5","Asharp3","Asharp4",
    "B1","B2","B3","B4","B5",
    "C1","C2","C3","C4","C5","C6","Csharp4","Csharp5",
    "D1","D2","D3","D4","D5","D6","Dsharp3","Dsharp4","Dsharp5",
    "E1","E2","E3","E4","E5","E6",
    "F1","F2","F3","F4","F5","Fsharp3","Fsharp4","Fsharp5",
    "G1","G2","G3","G4","G5","Gsharp3","Gsharp4","Gsharp5"
  ];

  function midi(code) {
    const match = /^([A-G])(sharp|flat|#|b)?(-?\d+)$/.exec(code);
    if (!match) throw new Error(`Note invalide : ${code}`);
    let pitch = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }[match[1]];
    if (match[2] === "sharp" || match[2] === "#") pitch++;
    if (match[2] === "flat" || match[2] === "b") pitch--;
    return (Number(match[3]) + 1) * 12 + pitch;
  }

  function nearest(values, target) {
    return values.reduce((best, value) =>
      Math.abs(value - target) < Math.abs(best - target) ? value : best
    );
  }

  async function loadBuffer(url) {
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

  function loadHtmlAudio(url) {
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

  function pianoSourceFor(targetMidi) {
    const candidates = pianoSamples.map(code => ({ code, midi:midi(code) }));
    return candidates.reduce((best, item) =>
      Math.abs(item.midi - targetMidi) < Math.abs(best.midi - targetMidi) ? item : best
    );
  }

  function soundingMidi(note, instrument) {
    return midi(note.written) + (instrument.transpose || 0);
  }

  async function preloadForLevel(instrumentId, level, timbre, onProgress) {
    const instrument = window.LDN_INSTRUMENTS[instrumentId];
    const urls = new Set(["sounds/duck.mp3"]);
    if (timbre === "instrument" && instrumentId !== "piano" && window.LDN_INSTRUMENT_BANKS[instrumentId]) {
      urls.add(window.LDN_INSTRUMENT_BANKS[instrumentId].file);
    } else {
      level.notes.forEach(note => {
        const sample = pianoSourceFor(soundingMidi(note, instrument));
        urls.add(`sounds/${sample.code}.mp3`);
      });
    }
    const list = [...urls];
    let done = 0;
    await Promise.all(list.map(async url => {
      if (useFileFallback) await loadHtmlAudio(url);
      else await loadBuffer(url);
      done++;
      onProgress?.(done / list.length);
    }));
  }

  async function resume() {
    if (context?.state === "suspended") await context.resume();
  }

  function stopActive() {
    if (activeSource) {
      try { activeSource.stop(); } catch (_) {}
      activeSource = null;
    }
    if (activeHtmlAudio) {
      activeHtmlAudio.pause();
      activeHtmlAudio = null;
    }
    if (activeHtmlTimer) {
      clearTimeout(activeHtmlTimer);
      activeHtmlTimer = null;
    }
  }

  async function playWithHtmlAudio(note, instrumentId, timbre, targetMidi) {
    stopActive();
    if (timbre === "instrument" && instrumentId !== "piano" && window.LDN_INSTRUMENT_BANKS[instrumentId]) {
      const bank = window.LDN_INSTRUMENT_BANKS[instrumentId];
      const anchor = nearest(bank.anchors, targetMidi);
      const anchorIndex = bank.anchors.indexOf(anchor);
      const audio = await loadHtmlAudio(bank.file);
      audio.pause();
      audio.volume = .82;
      audio.playbackRate = Math.pow(2, (targetMidi - anchor) / 12);
      audio.preservesPitch = false;
      audio.currentTime = anchorIndex * bank.segmentSeconds;
      activeHtmlAudio = audio;
      await audio.play();
      const duration = bank.playableSeconds / audio.playbackRate;
      activeHtmlTimer = setTimeout(() => {
        if (activeHtmlAudio === audio) {
          audio.pause();
          activeHtmlAudio = null;
        }
      }, duration * 1000);
      return;
    }
    const sample = pianoSourceFor(targetMidi);
    const audio = await loadHtmlAudio(`sounds/${sample.code}.mp3`);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = .8;
    audio.playbackRate = Math.pow(2, (targetMidi - sample.midi) / 12);
    audio.preservesPitch = false;
    activeHtmlAudio = audio;
    await audio.play();
  }

  async function playNote(note, instrumentId, timbre) {
    const instrument = window.LDN_INSTRUMENTS[instrumentId];
    const targetMidi = soundingMidi(note, instrument);
    if (useFileFallback || !context) return playWithHtmlAudio(note, instrumentId, timbre, targetMidi);
    await resume();
    stopActive();

    if (timbre === "instrument" && instrumentId !== "piano" && window.LDN_INSTRUMENT_BANKS[instrumentId]) {
      const bank = window.LDN_INSTRUMENT_BANKS[instrumentId];
      const anchor = nearest(bank.anchors, targetMidi);
      const anchorIndex = bank.anchors.indexOf(anchor);
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = await loadBuffer(bank.file);
      source.playbackRate.value = Math.pow(2, (targetMidi - anchor) / 12);
      source.connect(gain).connect(context.destination);
      const now = context.currentTime + .015;
      const duration = bank.playableSeconds / source.playbackRate.value;
      gain.gain.setValueAtTime(.82, now);
      gain.gain.setValueAtTime(.82, now + Math.max(.05, duration - .09));
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);
      source.start(now, anchorIndex * bank.segmentSeconds, bank.playableSeconds);
      activeSource = source;
      source.onended = () => { if (activeSource === source) activeSource = null; };
      return;
    }

    const sample = pianoSourceFor(targetMidi);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = await loadBuffer(`sounds/${sample.code}.mp3`);
    source.playbackRate.value = Math.pow(2, (targetMidi - sample.midi) / 12);
    gain.gain.value = .8;
    source.connect(gain).connect(context.destination);
    source.start(context.currentTime + .015);
    activeSource = source;
    source.onended = () => { if (activeSource === source) activeSource = null; };
  }

  async function playDuck() {
    if (useFileFallback || !context) {
      stopActive();
      const audio = await loadHtmlAudio("sounds/duck.mp3");
      audio.pause();
      audio.currentTime = 0;
      activeHtmlAudio = audio;
      return audio.play();
    }
    await resume();
    stopActive();
    const source = context.createBufferSource();
    source.buffer = await loadBuffer("sounds/duck.mp3");
    source.connect(context.destination);
    source.start();
    activeSource = source;
  }

  window.LDNAudio = Object.freeze({ preloadForLevel, playNote, playDuck, resume, midi });
}());
