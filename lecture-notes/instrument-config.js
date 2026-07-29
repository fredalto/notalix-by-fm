(function () {
  "use strict";
  const N = (written, clef, hint) => ({ written, clef, hint: hint || "" });
  const sol = (...codes) => codes.map(code => N(code, "sol"));
  const fa = (...codes) => codes.map(code => N(code, "fa"));
  const L = (title, pedagogy, notes) => ({ title, pedagogy, notes });

  window.LDN_INSTRUMENTS = {
    violon: {
      label: "Violon", transpose: 0,
      fingerings: { G3:"Corde de Sol · à vide",D4:"Corde de Ré · à vide",A4:"Corde de La · à vide",E5:"Corde de Mi · à vide" },
      levels: [
        L("Cordes à vide", "Les quatre cordes à vide : Sol, Ré, La et Mi.", sol("G3","D4","A4","E5")),
        L("Premier doigt", "Cordes à vide et premières notes avec le premier doigt.", sol("G3","A3","D4","E4","A4","B4","E5","F5")),
        L("Deuxième doigt", "Ajout des notes jouées avec le deuxième doigt.", sol("G3","A3","B3","D4","E4","F4","A4","B4","C5","E5","F5","G5")),
        L("Première position", "Lecture mélangée dans toute la première position.", sol("G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5","B5"))
      ]
    },
    alto: {
      label: "Alto", transpose: 0,
      fingerings: { C3:"Corde de Do · à vide",G3:"Corde de Sol · à vide",D4:"Corde de Ré · à vide",A4:"Corde de La · à vide" },
      levels: [
        L("Cordes à vide", "Les quatre cordes à vide en clé d’Ut 3.", [N("C3","ut3"),N("G3","ut3"),N("D4","ut3"),N("A4","ut3")]),
        L("Premier doigt", "Cordes à vide et premières notes avec le premier doigt.", ["C3","D3","G3","A3","D4","E4","A4","B4"].map(code=>N(code,"ut3"))),
        L("Deuxième doigt", "Ajout des notes jouées avec le deuxième doigt.", ["C3","D3","E3","G3","A3","B3","D4","E4","F4","A4","B4","C5"].map(code=>N(code,"ut3"))),
        L("Première position", "Lecture mélangée dans toute la première position.", ["C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5"].map(code=>N(code,"ut3")))
      ]
    },
    violoncelle: {
      label: "Violoncelle", transpose: 0,
      fingerings: { C2:"Corde de Do · à vide",G2:"Corde de Sol · à vide",D3:"Corde de Ré · à vide",A3:"Corde de La · à vide" },
      levels: [
        L("Cordes à vide", "Les quatre cordes à vide en clé de Fa.", fa("C2","G2","D3","A3")),
        L("Premier doigt", "Cordes à vide et premières notes avec le premier doigt.", fa("C2","D2","G2","A2","D3","E3","A3","B3")),
        L("Position resserrée", "Ajout des repères du deuxième doigt.", fa("C2","D2","E2","G2","A2","B2","D3","E3","F3","A3","B3","C4")),
        L("Première position", "Lecture mélangée dans toute la première position.", fa("C2","D2","E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4"))
      ]
    },
    contrebasse: {
      label: "Contrebasse", transpose: -12,
      fingerings: { E2:"Corde de Mi · à vide", A2:"Corde de La · à vide", D3:"Corde de Ré · à vide", G3:"Corde de Sol · à vide" },
      levels: [
        L("Cordes à vide", "Mi, La, Ré et Sol à vide — le son réel est une octave plus bas.", [N("E2","fa","Mi · corde à vide"),N("A2","fa","La · corde à vide"),N("D3","fa","Ré · corde à vide"),N("G3","fa","Sol · corde à vide")]),
        L("Demi-position", "Cordes à vide et premiers repères de demi-position.", [N("E2","fa","0"),N("F2","fa","1"),N("A2","fa","0"),N("B2","fa","1"),N("D3","fa","0"),N("E3","fa","1"),N("G3","fa","0"),N("A3","fa","1")]),
        L("Position étendue", "Ajout des notes jouées avec les doigts 2 et 4.", fa("E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3")),
        L("Première position", "Lecture mélangée sur toutes les cordes dans la première position.", fa("E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3"))
      ]
    },
    guitare: {
      label: "Guitare classique", transpose: -12,
      fingerings: { E3:"6e corde · à vide",F3:"6e corde · case 1",G3:"6e corde · case 3",A3:"5e corde · à vide",B3:"5e corde · case 2",C4:"5e corde · case 3",D4:"4e corde · à vide",E4:"4e corde · case 2",F4:"4e corde · case 3",G4:"3e corde · à vide",A4:"3e corde · case 2",B4:"2e corde · à vide",C5:"2e corde · case 1",D5:"2e corde · case 3",E5:"1re corde · à vide",F5:"1re corde · case 1",G5:"1re corde · case 3" },
      levels: [
        L("Cordes à vide", "Les six cordes à vide, écrites une octave au-dessus du son réel.", [N("E3","sol","6e corde"),N("A3","sol","5e corde"),N("D4","sol","4e corde"),N("G4","sol","3e corde"),N("B4","sol","2e corde"),N("E5","sol","1re corde")]),
        L("Première case", "Cordes à vide et notes de la première case.", sol("E3","F3","A3","B3","D4","E4","G4","A4","B4","C5","E5","F5")),
        L("Cases 0 à 3", "Lecture progressive en première position.", sol("E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5")),
        L("Première position", "Mélange des six cordes jusqu’à la troisième case.", sol("E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5"))
      ]
    },
    flute: { label:"Flûte traversière", transpose:0, levels:[L("Premiers repères","Si, La et Sol : trois premiers repères conjoints.",sol("G4","A4","B4")),L("Cinq notes","Ajout de Do et Ré.",sol("G4","A4","B4","C5","D5")),L("Octave centrale","Lecture conjointe de Do4 à Do5.",sol("C4","D4","E4","F4","G4","A4","B4","C5")),L("Tessiture élargie","Mélange du registre central et aigu.",sol("C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5"))] },
    hautbois: { label:"Hautbois", transpose:0, levels:[L("Premiers repères","Si, La et Sol, puis mouvements conjoints.",sol("G4","A4","B4")),L("Cinq notes","De Sol à Ré.",sol("G4","A4","B4","C5","D5")),L("Octave centrale","De Do4 à Do5.",sol("C4","D4","E4","F4","G4","A4","B4","C5")),L("Tessiture élargie","Lecture du registre central.",sol("B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5"))] },
    clarinette: { label:"Clarinette en Si♭", transpose:-2, spelling:"flat", levels:[L("Premiers sons","Sol, Fa et Mi écrits : premiers repères de la main gauche.",sol("E4","F4","G4")),L("Cinq notes","Extension progressive de Ré à La écrits.",sol("D4","E4","F4","G4","A4")),L("Registre médium","Lecture conjointe de Do4 à Si4 écrits.",sol("C4","D4","E4","F4","G4","A4","B4")),L("Tessiture élargie","Extension vers le chalumeau grave et le passage de registre.",sol("G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5"))] },
    basson: { label:"Basson", transpose:0, levels:[L("Premiers repères","Fa, Sol et La en clé de Fa.",fa("F2","G2","A2")),L("Cinq notes","De Fa2 à Do3.",fa("F2","G2","A2","B2","C3")),L("Octave centrale","Lecture de Do2 à Do3.",fa("C2","D2","E2","F2","G2","A2","B2","C3")),L("Tessiture élargie","Mélange du grave et du médium.",fa("B1","C2","D2","E2","F2","G2","A2","B2","C3","D3","E3","F3"))] },
    saxophone: { label:"Saxophone alto en Mi♭", transpose:-9, spelling:"flat", levels:[L("Premiers repères","Si, La, Sol écrits ; son réel une sixte majeure plus bas.",sol("G4","A4","B4")),L("Cinq notes","De Sol à Ré écrits.",sol("G4","A4","B4","C5","D5")),L("Octave écrite","De Do4 à Do5.",sol("C4","D4","E4","F4","G4","A4","B4","C5")),L("Tessiture élargie","Lecture écrite du médium.",sol("B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5"))] },
    cor: { label:"Cor en Fa", transpose:-7, spelling:"flat", levels:[L("Premiers repères","Do, Ré, Mi écrits ; son réel une quinte plus bas.",sol("C4","D4","E4")),L("Cinq notes","De Do à Sol écrits.",sol("C4","D4","E4","F4","G4")),L("Octave centrale","De Do4 à Do5 écrits.",sol("C4","D4","E4","F4","G4","A4","B4","C5")),L("Tessiture élargie","Lecture écrite autour du registre médium.",sol("G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5"))] },
    trompette: { label:"Trompette / Cornet en Si♭", transpose:-2, spelling:"flat", levels:[L("Premiers repères","Do, Ré, Mi écrits ; son réel un ton plus bas.",sol("C4","D4","E4")),L("Cinq notes","De Do à Sol écrits.",sol("C4","D4","E4","F4","G4")),L("Octave centrale","De Do4 à Do5 écrits.",sol("C4","D4","E4","F4","G4","A4","B4","C5")),L("Tessiture élargie","Lecture écrite du médium.",sol("G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5"))] },
    trombone: { label:"Trombone", transpose:0, levels:[L("Premiers repères","Si♭, Do et Ré sont remplacés ici par des repères diatoniques naturels.",fa("B2","C3","D3")),L("Cinq notes","De Fa2 à Do3.",fa("F2","G2","A2","B2","C3")),L("Octave centrale","De Fa2 à Fa3.",fa("F2","G2","A2","B2","C3","D3","E3","F3")),L("Tessiture élargie","Lecture en clé de Fa dans le grave et le médium.",fa("B1","C2","D2","E2","F2","G2","A2","B2","C3","D3","E3","F3","G3"))] },
    tuba: { label:"Tuba", transpose:0, levels:[L("Premiers repères","Fa, Sol et La en sons réels.",fa("F1","G1","A1")),L("Cinq notes","De Fa1 à Do2.",fa("F1","G1","A1","B1","C2")),L("Octave grave","De Do1 à Do2.",fa("C1","D1","E1","F1","G1","A1","B1","C2")),L("Tessiture élargie","Mélange du registre grave.",fa("C1","D1","E1","F1","G1","A1","B1","C2","D2","E2","F2"))] },
    accordeon: { label:"Accordéon", transpose:0, levels:[L("Main droite","Cinq notes en clé de Sol.",sol("C4","D4","E4","F4","G4")),L("Main gauche","Repères de basse en clé de Fa.",fa("C2","F2","G2","C3")),L("Deux claviers","Alternance entre clé de Sol et clé de Fa.",[...sol("C4","D4","E4","F4","G4"),...fa("C2","D2","E2","F2","G2")]),L("Lecture complète","Mélange des deux clés.",[...sol("C4","D4","E4","F4","G4","A4","B4","C5"),...fa("C2","D2","E2","F2","G2","A2","B2","C3")])] },
    piano: { label:"Piano", transpose:0, levels:[L("Main droite","Do central à Sol en clé de Sol.",sol("C4","D4","E4","F4","G4")),L("Main gauche","Do à Sol en clé de Fa.",fa("C3","D3","E3","F3","G3")),L("Deux mains","Alternance entre les deux clés.",[...sol("C4","D4","E4","F4","G4"),...fa("C3","D3","E3","F3","G3")]),L("Grand clavier","Deux octaves autour du Do central.",[...fa("C2","D2","E2","F2","G2","A2","B2","C3"),...sol("C4","D4","E4","F4","G4","A4","B4","C5")])] },
    orgue: { label:"Orgue", transpose:0, levels:[L("Clavier supérieur","Cinq notes en clé de Sol.",sol("C4","D4","E4","F4","G4")),L("Clavier inférieur","Cinq notes en clé de Fa.",fa("C3","D3","E3","F3","G3")),L("Deux claviers","Alternance des deux portées.",[...sol("C4","D4","E4","F4","G4"),...fa("C3","D3","E3","F3","G3")]),L("Claviers et pédalier","Ajout des notes graves du pédalier.",[...fa("C2","D2","E2","F2","G2","A2","B2","C3"),...sol("C4","D4","E4","F4","G4","A4","B4","C5")])] },
    clavecin: { label:"Clavecin", transpose:0, levels:[L("Main droite","Cinq notes en clé de Sol.",sol("C4","D4","E4","F4","G4")),L("Main gauche","Cinq notes en clé de Fa.",fa("C3","D3","E3","F3","G3")),L("Deux mains","Alternance des deux clés.",[...sol("C4","D4","E4","F4","G4"),...fa("C3","D3","E3","F3","G3")]),L("Étendue complète","Lecture mélangée sur les deux claviers.",[...fa("C2","D2","E2","F2","G2","A2","B2","C3"),...sol("C4","D4","E4","F4","G4","A4","B4","C5")])] },
    flute_a_bec: { label:"Flûte à bec", transpose:0, levels:[L("Premiers repères","Si, La et Sol.",sol("G4","A4","B4")),L("Cinq notes","De Sol à Ré.",sol("G4","A4","B4","C5","D5")),L("Octave centrale","De Do4 à Do5.",sol("C4","D4","E4","F4","G4","A4","B4","C5")),L("Tessiture élargie","Registre central et aigu.",sol("C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5"))] },
    chant: { label:"Chant", transpose:0, levels:[L("Trois notes","Do, Ré et Mi dans le médium.",sol("C4","D4","E4")),L("Cinq notes","De Do à Sol.",sol("C4","D4","E4","F4","G4")),L("Octave centrale","De Do4 à Do5.",sol("C4","D4","E4","F4","G4","A4","B4","C5")),L("Tessiture mélangée","Lecture conjointe du médium.",sol("A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5"))] }
  };
  window.LDN_INSTRUMENTS.trompette.fingerings = { G3:"Pistons 1 et 3",A3:"Pistons 1 et 2",B3:"Piston 2",C4:"Pistons ouverts",D4:"Pistons 1 et 3",E4:"Pistons 1 et 2",F4:"Piston 1",G4:"Pistons ouverts",A4:"Pistons 1 et 2",B4:"Piston 2",C5:"Pistons ouverts",D5:"Piston 1" };
  window.LDN_INSTRUMENTS.trombone.fingerings = { E2:"7e position",F2:"6e position",G2:"4e position",A2:"2e position",B2:"7e position",C3:"6e position",D3:"4e position",E3:"2e position",F3:"1re position",G3:"4e position" };
  window.LDN_GENERIC_INSTRUMENTS = Object.keys(window.LDN_INSTRUMENTS);
}());
