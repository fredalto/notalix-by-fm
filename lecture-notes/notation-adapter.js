(function () {
  "use strict";

  const NOTE_PATTERN = /^note:(sol|fa|ut3|ut4):([A-G](?:sharp|flat)?-?\d+)$/i;

  function parseImageSource(source) {
    const match = NOTE_PATTERN.exec(source || "");
    if (!match) return null;
    return { clef: match[1].toLowerCase(), note: match[2].replace("sharp", "#").replace("flat", "b") };
  }

  function renderingTarget(image, dynamic) {
    const existing = image.parentElement?.querySelector(`.ldn-generated-note[data-for="${image.id || "reference"}"]`);
    if (existing) return existing;
    const target = document.createElement("div");
    target.className = `ldn-generated-note${dynamic ? " ldn-generated-note--quiz" : " ldn-generated-note--reference"}`;
    target.dataset.for = image.id || "reference";
    image.insertAdjacentElement("afterend", target);
    return target;
  }

  function renderFromImage(image, dynamic) {
    const parsed = parseImageSource(image.getAttribute("src") || image.src);
    if (!parsed || !window.LDNNoteRenderer) return false;

    image.onerror = null;
    image.classList.add("ldn-notation-source");
    image.setAttribute("aria-hidden", "true");
    const target = renderingTarget(image, dynamic);
    window.LDNNoteRenderer.renderNote(target, {
      note: parsed.note,
      clef: parsed.clef,
      label: `Clé ${parsed.clef}`,
      adaptive: true,
      minHeight: dynamic ? 250 : 160
    });
    return true;
  }

  function installDynamicRenderer(image) {
    renderFromImage(image, true);
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.type === "attributes" && mutation.attributeName === "src")) {
        renderFromImage(image, true);
      }
    });
    observer.observe(image, { attributes: true, attributeFilter: ["src"] });
  }

  function initialize() {
    document.querySelectorAll('img[src^="note:"]').forEach(image => {
      if (image.id !== "note-image") renderFromImage(image, false);
    });

    const quizImage = document.getElementById("note-image");
    if (quizImage) installDynamicRenderer(quizImage);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
}());
