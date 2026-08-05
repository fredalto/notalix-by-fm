(function () {
  if (document.querySelector('.notalix-bar')) return;


  var folder = (location.pathname.split('/').filter(Boolean).slice(-2, -1)[0] || '').toLowerCase();
  var modules = {
    'lecture-notes': 'Lecture de Notes Express',
    'intervalles': 'Intervalles',
    'tonalites': 'Tonalités',
    'accords': 'Accords',
    'cadences': 'Cadences',
    'dictee-melodique': 'Dictée mélodique',
    'dictee-rythmique': 'Dictée rythmique',
    'lecture-rythmique': 'Lecture rythmique'
  };
  var moduleName = modules[folder] || 'Formation musicale';
  if (folder) document.body.classList.add('notalix-module-' + folder);

  var bar = document.createElement('header');
  bar.className = 'notalix-bar';
  bar.innerHTML =
    '<a class="notalix-home" href="../index.html" aria-label="Retour à l’accueil NOTALIX">← Accueil NOTALIX</a>' +
    '<div class="notalix-brand" aria-label="NOTALIX by FM">' +
      '<span class="notalix-note" aria-hidden="true">♪</span>' +
      '<span class="notalix-word">NOTALIX</span>' +
      '<span class="notalix-by">by FM</span>' +
      
      '<span class="notalix-module">' + moduleName + '</span>' +
    '</div>' +
    '<a class="notalix-site" href="https://sites.google.com/view/fmcrdcalais/musiclab">Site Formation Musicale ↗</a>';

  document.body.insertBefore(bar, document.body.firstChild);
})();
