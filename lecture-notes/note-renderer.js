(function () {
  "use strict";

  const CLEFS = Object.freeze({ sol: "treble", fa: "bass", fa3:"baritone-f", ut1:"soprano", ut2:"mezzo-soprano", ut3: "alto", ut4: "tenor" });
  const CLEF_LABELS = Object.freeze({ sol:"Clé de Sol", fa:"Clé de Fa", fa3:"Clé de Fa 3e", ut1:"Clé d’Ut 1re", ut2:"Clé d’Ut 2e", ut3:"Clé d’Ut 3e", ut4:"Clé d’Ut 4e" });
  const STAFF_RANGES = Object.freeze({
    sol: { bottom:"E4", top:"F5" },
    fa:  { bottom:"G2", top:"A3" },
    ut3: { bottom:"F3", top:"G4" },
    ut4: { bottom:"D3", top:"E4" },
    ut1: { bottom:"C4", top:"D5" },
    ut2: { bottom:"A3", top:"B4" },
    fa3: { bottom:"B2", top:"C4" }
  });

  function diatonicPosition(code) {
    const match = /^([A-Ga-g])(?:[#b])?(-?\d+)$/.exec(code);
    if (!match) return 0;
    const letter = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 }[match[1].toUpperCase()];
    return Number(match[2]) * 7 + letter;
  }

  function adaptiveLayout(noteOrRange, clefName, minHeight) {
    const range = STAFF_RANGES[clefName] || STAFF_RANGES.sol;
    const notes = Array.isArray(noteOrRange) ? noteOrRange : [noteOrRange];
    const positions = notes.map(diatonicPosition);
    const below = Math.max(0, ...positions.map(position => diatonicPosition(range.bottom) - position));
    const above = Math.max(0, ...positions.map(position => position - diatonicPosition(range.top)));
    const topSpace = 34 + above * 8;
    const bottomSpace = 52 + below * 8;
    return {
      height: Math.max(minHeight || 150, topSpace + 58 + bottomSpace),
      staveY: topSpace
    };
  }

  function toVexKey(code) {
    const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(code);
    if (!match) throw new Error(`Note invalide : ${code}`);
    return `${match[1].toLowerCase()}${match[2]}/${match[3]}`;
  }

  function renderNote(target, options) {
    if (!window.VexFlow) throw new Error("VexFlow n’est pas chargé.");
    const { Renderer, Stave, StaveNote, TickContext } = window.VexFlow;
    const clef = CLEFS[options.clef] || options.clef;
    const width = options.width || 120;
    const layout = options.adaptive
      ? adaptiveLayout(options.rangeNotes?.length ? options.rangeNotes : options.note, options.clef, options.minHeight || options.height)
      : { height:options.height || 135, staveY:25 };
    if (options.compact) {
      layout.height = Math.max(options.minHeight || 145, layout.height - 34);
      layout.staveY = Math.max(20, layout.staveY - 12);
    }
    const height = layout.height;

    target.replaceChildren();
    target.style.height = `${height}px`;
    target.setAttribute("role", "img");
    target.setAttribute("aria-label", `${options.note}, ${options.label || CLEF_LABELS[options.clef] || options.clef}`);

    const renderer = new Renderer(target, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const staveWidth = Math.min(width - 6, options.staveWidth || width - 6);
    const staveX = options.centerStave ? Math.round((width - staveWidth) / 2) : 3;
    if (options.staveOffsetY) layout.staveY += options.staveOffsetY;
    const stave = new Stave(staveX, layout.staveY, staveWidth, options.lineSpacing ? { spacing_between_lines_px: options.lineSpacing } : undefined);
    stave.addClef(clef).setContext(context).draw();

    const staveNote = new StaveNote({
      clef,
      keys: [toVexKey(options.note)],
      duration: "q",
      autoStem: true
    });
    staveNote.noteHeads.forEach(noteHead => {
      noteHead.setFontSize(noteHead.fontSizeInPoints * (options.noteScale || 1.25));
    });
    staveNote.getStem()?.setVisibility(false);
    new TickContext().addTickable(staveNote).preFormat().setX(Math.round(width * 0.15));
    staveNote.setContext(context).setStave(stave).draw();

    const svg = target.querySelector("svg");
    if (svg) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
    }
  }

  function renderNotes(target, options) {
    if (!window.VexFlow) throw new Error("VexFlow n’est pas chargé.");
    const { Renderer, Stave, StaveNote, TickContext } = window.VexFlow;
    const notes = options.notes || [];
    const clef = CLEFS[options.clef] || options.clef;
    const width = options.width || 520;
    const layout = adaptiveLayout(notes, options.clef, options.minHeight || 170);
    layout.height = Math.max(options.minHeight || 150, layout.height - 28);
    layout.staveY = Math.max(20, layout.staveY - 10);
    const height = layout.height;
    target.replaceChildren();
    target.style.height = `${height}px`;
    target.setAttribute("role", "img");
    target.setAttribute("aria-label", options.label || notes.join(", "));
    const renderer = new Renderer(target, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const staveX = 34;
    const staveWidth = width - 68;
    const stave = new Stave(staveX, layout.staveY, staveWidth, options.lineSpacing ? { spacing_between_lines_px: options.lineSpacing } : undefined);
    stave.addClef(clef).setContext(context).draw();
    // TickContext adds its own offset once attached to the stave. These values
    // deliberately compensate for it so the visible notes remain centred.
    const usableStart = width * .15;
    const usableEnd = width * .63;
    notes.forEach((code, index) => {
      const staveNote = new StaveNote({ clef, keys:[toVexKey(code)], duration:"q", autoStem:true });
      staveNote.noteHeads.forEach(noteHead => noteHead.setFontSize(noteHead.fontSizeInPoints * (options.noteScale || 1)));
      staveNote.getStem()?.setVisibility(false);
      const ratio = notes.length === 1 ? .5 : index / (notes.length - 1);
      new TickContext().addTickable(staveNote).preFormat().setX(Math.round(usableStart + (usableEnd - usableStart) * ratio));
      staveNote.setContext(context).setStave(stave).draw();
    });
    const svg = target.querySelector("svg");
    if (svg) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
    }
  }

  window.LDNNoteRenderer = Object.freeze({ renderNote, renderNotes, clefs: CLEFS, clefLabels:CLEF_LABELS, adaptiveLayout });
}());
