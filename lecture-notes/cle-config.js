(function () {
  "use strict";
  const N = (written, clef) => ({ written, clef });
  const notes = (clef, codes) => codes.map(code => N(code, clef));
  const S = (title, pedagogy, codes, clef) => ({ title, pedagogy, notes:notes(clef, codes) });
  const R = (title, clefs, stage, target, time) => ({ title, clefs, stage, target, time });

  window.LDN_CLEFS = {
    sol:{ label:"Clé de Sol", cycle:1, stages:[
      S("Notes repères","Les quatre repères : Sol 4, Do 4, Do 5 et La 5.",["G4","C4","C5","A5"],"sol"),
      S("Autour des repères","Les notes conjointes autour des repères, sans retirer les quatre repères.",["C4","E4","F4","G4","A4","B4","C5","D5","E5","A5"],"sol"),
      S("Lecture étendue","Lecture générale en clé de Sol.",["C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5"],"sol")
    ]},
    fa:{ label:"Clé de Fa", cycle:1, stages:[
      S("Notes repères","Les quatre repères : Fa 3, Do 4, Mi 2 et Si 2.",["F3","C4","E2","B2"],"fa"),
      S("Autour des repères","Les notes conjointes autour des repères, sans retirer les quatre repères.",["E2","G2","A2","B2","C3","D3","E3","F3","G3","A3","C4"],"fa"),
      S("Lecture étendue","Lecture générale en clé de Fa.",["C2","D2","E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4"],"fa")
    ]},
    ut3:{ label:"Clé d’Ut 3e", cycle:2, stages:[
      S("Notes repères","Les quatre repères : Do 4, Sol 4, Do 3 et Fa 3.",["C4","G4","C3","F3"],"ut3"),
      S("Autour des repères","Les notes conjointes autour des repères, sans retirer les quatre repères.",["C3","F3","G3","A3","B3","C4","D4","E4","F4","G4"],"ut3"),
      S("Lecture étendue","Lecture générale en clé d’Ut 3.",["C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5"],"ut3")
    ]},
    ut4:{ label:"Clé d’Ut 4e", cycle:2, stages:[
      S("Notes repères","Les quatre repères : Do 4, Fa 4, Ré 3 et Sol 3.",["C4","F4","D3","G3"],"ut4"),
      S("Autour des repères","Les notes conjointes autour des repères, sans retirer les quatre repères.",["D3","E3","F3","G3","A3","B3","C4","D4","E4","F4"],"ut4"),
      S("Lecture étendue","Lecture générale en clé d’Ut 4.",["A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4"],"ut4")
    ]},
    ut1:{ label:"Clé d’Ut 1re", cycle:3, stages:[
      S("Notes repères","Do sur la 1re ligne, Mi et Sol.",["C4","E4","G4"],"ut1"),
      S("Autour des repères","Les notes conjointes autour des repères.",["C4","D4","E4","F4","G4","A4","B4","C5"],"ut1"),
      S("Lecture étendue","Lecture générale en clé d’Ut 1.",["A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5"],"ut1")
    ]},
    ut2:{ label:"Clé d’Ut 2e", cycle:3, stages:[
      S("Notes repères","Do sur la 2e ligne, La et Mi.",["A3","C4","E4"],"ut2"),
      S("Autour des repères","Les notes conjointes autour des repères.",["G3","A3","B3","C4","D4","E4","F4"],"ut2"),
      S("Lecture étendue","Lecture générale en clé d’Ut 2.",["E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5"],"ut2")
    ]},
    fa3:{ label:"Clé de Fa 3e", cycle:3, stages:[
      S("Notes repères","Fa sur la 3e ligne, Do et La.",["C3","F3","A3"],"fa3"),
      S("Autour des repères","Les notes conjointes autour des repères.",["A2","B2","C3","D3","E3","F3","G3","A3","B3"],"fa3"),
      S("Lecture étendue","Lecture générale en clé de Fa 3e.",["E2","F2","G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4"],"fa3")
    ]}
  };
  window.LDN_CYCLES = {
    sol:{ label:"Défi Clé de Sol", clefs:["sol"], rounds:[
      R("Notes repères",["sol"],0,6,35),
      R("Autour des repères",["sol"],1,10,45),
      R("Lecture étendue",["sol"],2,12,50)
    ]},
    fa:{ label:"Défi Clé de Fa", clefs:["fa"], rounds:[
      R("Notes repères",["fa"],0,6,35),
      R("Autour des repères",["fa"],1,10,45),
      R("Lecture étendue",["fa"],2,12,50)
    ]},
    ut3:{ label:"Défi Clé d’Ut 3e", clefs:["ut3"], rounds:[
      R("Notes repères",["ut3"],0,6,35),R("Autour des repères",["ut3"],1,10,45),R("Lecture étendue",["ut3"],2,12,50)
    ]},
    ut4:{ label:"Défi Clé d’Ut 4e", clefs:["ut4"], rounds:[
      R("Notes repères",["ut4"],0,6,35),R("Autour des repères",["ut4"],1,10,45),R("Lecture étendue",["ut4"],2,12,50)
    ]},
    ut1:{ label:"Défi Clé d’Ut 1re", clefs:["ut1"], rounds:[
      R("Notes repères",["ut1"],0,6,35),R("Autour des repères",["ut1"],1,10,45),R("Lecture étendue",["ut1"],2,12,50)
    ]},
    ut2:{ label:"Défi Clé d’Ut 2e", clefs:["ut2"], rounds:[
      R("Notes repères",["ut2"],0,6,35),R("Autour des repères",["ut2"],1,10,45),R("Lecture étendue",["ut2"],2,12,50)
    ]},
    fa3:{ label:"Défi Clé de Fa 3e", clefs:["fa3"], rounds:[
      R("Notes repères",["fa3"],0,6,35),R("Autour des repères",["fa3"],1,10,45),R("Lecture étendue",["fa3"],2,12,50)
    ]},
    solfa:{ label:"Défi Sol + Fa", clefs:["sol","fa"], rounds:[
      R("Repères · Clé de Sol",["sol"],0,6,35),
      R("Repères · Clé de Fa",["fa"],0,6,35),
      R("Repères · Sol et Fa",["sol","fa"],0,8,40),
      R("Autour des repères · deux clés",["sol","fa"],1,10,45),
      R("Lecture étendue · deux clés",["sol","fa"],2,12,50)
    ]},
    cycle1:{ label:"Défi Sol + Fa", clefs:["sol","fa"], rounds:[
      R("Repères · Clé de Sol",["sol"],0,6,35),
      R("Repères · Clé de Fa",["fa"],0,6,35),
      R("Repères · Sol et Fa",["sol","fa"],0,8,40),
      R("Autour des repères · deux clés",["sol","fa"],1,10,45),
      R("Lecture étendue · deux clés",["sol","fa"],2,12,50)
    ]},
    cycle2:{ label:"Défi 4 clés", clefs:["sol","fa","ut3","ut4"], rounds:[
      R("Repères · Sol et Fa",["sol","fa"],0,8,40),
      R("Repères · Clé d’Ut 3e",["ut3"],0,6,35),
      R("Repères · Clé d’Ut 4e",["ut4"],0,6,35),
      R("Repères · Ut 3e et Ut 4e",["ut3","ut4"],0,8,40),
      R("Repères · quatre clés",["sol","fa","ut3","ut4"],0,10,45),
      R("Autour des repères · quatre clés",["sol","fa","ut3","ut4"],1,12,50),
      R("Lecture étendue · quatre clés",["sol","fa","ut3","ut4"],2,14,55)
    ]},
    cycle3:{ label:"Défi ultime · 7 clés", clefs:["sol","fa","ut3","ut4","ut1","ut2","fa3"], rounds:[
      R("Repères acquis · quatre clés",["sol","fa","ut3","ut4"],0,8,40),
      R("Repères · Clé d’Ut 1re",["ut1"],0,6,35),
      R("Repères · Clé d’Ut 2e",["ut2"],0,6,35),
      R("Repères · Clé de Fa 3e",["fa3"],0,6,35),
      R("Repères · les trois nouvelles clés",["ut1","ut2","fa3"],0,9,45),
      R("Autour des repères · sept clés",["sol","fa","ut3","ut4","ut1","ut2","fa3"],1,12,55),
      R("Défi ultime · les sept clés",["sol","fa","ut3","ut4","ut1","ut2","fa3"],2,15,60)
    ]}
  };
}());
