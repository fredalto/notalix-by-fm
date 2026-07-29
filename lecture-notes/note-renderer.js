(function () {
  "use strict";

  const CLEFS = Object.freeze({ sol: "treble", fa: "bass", ut3: "alto", ut4: "tenor" });

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
    const height = options.height || 135;

    target.replaceChildren();
    target.setAttribute("role", "img");
    target.setAttribute("aria-label", `${options.note}, ${options.label || options.clef}`);

    const renderer = new Renderer(target, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const stave = new Stave(3, 25, width - 6);
    stave.addClef(clef).setContext(context).draw();

    const staveNote = new StaveNote({
      clef,
      keys: [toVexKey(options.note)],
      duration: "q",
      autoStem: true
    });
    staveNote.noteHeads.forEach(noteHead => {
      noteHead.setFontSize(noteHead.fontSizeInPoints * 1.25);
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

  window.LDNNoteRenderer = Object.freeze({ renderNote, clefs: CLEFS });
}());
