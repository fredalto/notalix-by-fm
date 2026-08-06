(function () {
  "use strict";

  const NOTE_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const note = (written, clef) => ({ written, clef });
  const pitch = written => Number(written.slice(1)) * 7 + NOTE_INDEX[written[0]];
  const unique = values => [...new Set(values)].sort((a, b) => pitch(a) - pitch(b));

  const RAW = {
    sol: { label: "Clé de Sol", group: 1, landmarks: ["G4", "C4", "C5", "A5"], full: ["C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5"] },
    fa:  { label: "Clé de Fa", group: 1, landmarks: ["F3", "C4", "E2", "B2"], full: ["C2","D2","E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4"] },
    ut3: { label: "Clé d’Ut 3e", group: 2, landmarks: ["C4", "G4", "C3", "F3"], full: ["C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5"] },
    ut4: { label: "Clé d’Ut 4e", group: 2, landmarks: ["C4", "F4", "D3", "G3"], full: ["A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4"] },
    ut1: { label: "Clé d’Ut 1re", group: 3, landmarks: ["C4", "E4", "G4"], full: ["A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5"] },
    ut2: { label: "Clé d’Ut 2e", group: 3, landmarks: ["A3", "C4", "E4"], full: ["E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5"] },
    fa3: { label: "Clé de Fa 3e", group: 3, landmarks: ["C3", "F3", "A3"], full: ["E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4"] }
  };

  function around(full, landmarks, distance) {
    const landmarkSet = new Set(landmarks);
    const indices = landmarks.map(value => full.indexOf(value)).filter(index => index >= 0);
    return unique(indices.flatMap(index => [full[index - distance], full[index + distance]]).filter(Boolean).filter(value => !landmarkSet.has(value)));
  }

  function stage(title, pedagogy, clef, codes, mode, groups, focus) {
    const convert = values => unique(values).map(value => note(value, clef));
    return {
      title,
      pedagogy,
      mode,
      notes: convert(codes),
      focus: convert(focus || codes),
      groups: Object.fromEntries(Object.entries(groups).map(([name, values]) => [name, convert(values)]))
    };
  }

  function buildClef(clef, source) {
    const landmarks = unique(source.landmarks);
    const adjacent = around(source.full, source.landmarks, 1);
    const thirds = around(source.full, source.landmarks, 2);
    const firstThree = unique([...landmarks, ...adjacent, ...thirds]);
    return {
      label: source.label,
      group: source.group,
      landmarks: landmarks.map(value => note(value, clef)),
      stages: [
        stage("Notes repères", "Reconnaître immédiatement les points d’appui de la clé.", clef, landmarks, "landmarks", { landmarks }, landmarks),
        stage("Repères + notes conjointes", "Alterner une note repère et une note juste à côté.", clef, [...landmarks, ...adjacent], "landmark-adjacent", { landmarks, adjacent }, adjacent),
        stage("Notes conjointes + tierces", "Passer d’une note voisine à une note située à la tierce.", clef, [...adjacent, ...thirds], "adjacent-thirds", { adjacent, thirds }, thirds),
        stage("Repères + conjointes + tierces", "Mélanger les trois familles de notes déjà travaillées.", clef, firstThree, "landmark-adjacent-thirds", { landmarks, adjacent, thirds }, landmarks),
        stage("Toutes les notes", "Lire toute l’étendue proposée dans cette clé.", clef, source.full, "all", { all: source.full }, source.full.filter(value => !firstThree.includes(value)))
      ]
    };
  }

  window.LDN_CLEFS = Object.fromEntries(Object.entries(RAW).map(([clef, source]) => [clef, buildClef(clef, source)]));

  const roundNames = [
    "Niveau 1 · Notes repères",
    "Niveau 2 · Repères + conjointes",
    "Niveau 3 · Conjointes + tierces",
    "Niveau 4 · Synthèse",
    "Niveau 5 · Toutes les notes"
  ];
  const targets = [8, 10, 12, 14, 16];
  const times = [40, 45, 50, 55, 60];
  const rounds = clefs => roundNames.map((title, stageIndex) => ({ title, clefs, stage: stageIndex, target: targets[stageIndex], time: times[stageIndex] }));
  const challenge = (label, clefs) => ({ label, clefs, rounds: rounds(clefs) });

  window.LDN_CYCLES = {
    sol: challenge("Défi Clé de Sol", ["sol"]),
    fa: challenge("Défi Clé de Fa", ["fa"]),
    solfa: challenge("Défi Sol + Fa", ["sol", "fa"]),
    ultimate: challenge("Défi ultime · quatre clés", ["sol", "fa", "ut3", "ut4"]),
    heroes: challenge("Défi des Héros · sept clés", ["sol", "fa", "ut3", "ut4", "ut1", "ut2", "fa3"]),
    cycle1: challenge("Défi Sol + Fa", ["sol", "fa"]),
    cycle2: challenge("Défi ultime · quatre clés", ["sol", "fa", "ut3", "ut4"]),
    cycle3: challenge("Défi des Héros · sept clés", ["sol", "fa", "ut3", "ut4", "ut1", "ut2", "fa3"])
  };
}());
