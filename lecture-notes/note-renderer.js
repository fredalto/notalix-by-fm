(function () {
  "use strict";

  const CLEFS = Object.freeze({ sol: "treble", fa: "bass", ut3: "alto", ut4: "tenor" });
  const STAFF_RANGES = Object.freeze({
    sol: { bottom:"E4", top:"F5" },
    fa:  { bottom:"G2", top:"A3" },
    ut3: { bottom:"F3", top:"G4" },
    ut4: { bottom:"D3", top:"E4" }
  });

  function diatonicPosition(code) {
    const match = /^([A-Ga-g])(?:[#b])?(-?\d+)$/.exec(code);
    if (!match) return 0;
    const letter = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 }[match[1].toUpperCase()];
    return Number(match[2]) * 7 + letter;
  }

  function adaptiveLayout(note, clefName, minHeight) {
    const range = STAFF_RANGES[clefName] || STAFF_RANGES.sol;
    const position = diatonicPosition(note);
    const below = Math.max(0, diatonicPosition(range.bottom) - position);
    const above = Math.max(0, position - diatonicPosition(range.top));
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
      ? adaptiveLayout(options.note, options.clef, options.minHeight || options.height)
      : { height:options.height || 135, staveY:25 };
    if (options.compact) {
      layout.height = Math.max(options.minHeight || 145, layout.height - 34);
      layout.staveY = Math.max(20, layout.staveY - 12);
    }
    const height = layout.height;

    target.replaceChildren();
    target.style.height = `${height}px`;
    target.setAttribute("role", "img");
    target.setAttribute("aria-label", `${options.note}, ${options.label || options.clef}`);

    const renderer = new Renderer(target, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const stave = new Stave(3, layout.staveY, width - 6, options.lineSpacing ? { spacing_between_lines_px: options.lineSpacing } : undefined);
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

  window.LDNNoteRenderer = Object.freeze({ renderNote, clefs: CLEFS, adaptiveLayout });
}());
