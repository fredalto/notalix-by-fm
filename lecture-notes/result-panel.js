(function () {
  "use strict";
  const teachers = ["Barbara", "Benoit", "Céline", "Chloé", "Frédéric", "Sandrine", "Thomas"];
  const options = (label, values) => `<option value="Aucun">${label} (facultatif)</option>${values.map(value => `<option value="${value}">${value}</option>`).join("")}`;
  function render(host, kind) {
    if (!host || host.dataset.ready === "true") return;
    const key = kind === "key";
    const ids = key ? { title:"key-result-title",score:"key-result-score",text:"key-result-text",restart:"key-restart",home:"key-result-home",details:"key-send-score",first:"key-prenom",last:"key-nom",fm:"key-prof-fm",instrument:"key-prof-instrument",send:"key-send-button",confirmation:"key-send-confirmation",loading:"key-loading-message" }
      : { title:"result-title",score:"result-score",text:"result-text",restart:"restart",home:"result-home",details:"send-score",first:"prenom",last:"nom",fm:"prof_fm",instrument:"prof_instrument",send:"send-score-button",confirmation:"confirmation",loading:"loading-message" };
    host.innerHTML = `<span class="result-symbol" aria-hidden="true">✓</span><p class="result-kicker">Exercice terminé</p><h2 id="${ids.title}"></h2><strong id="${ids.score}" class="result-score"></strong><p id="${ids.text}"></p><div class="result-actions"><button id="${ids.restart}" class="button" type="button">Recommencer</button><a id="${ids.home}" class="button secondary" href="index.html?mode=${key?"cle":"instrument"}">Choisir un autre exercice</a></div><details id="${ids.details}" class="result-share"><summary>Envoyer volontairement mon résultat</summary><p>Rien n’est envoyé sans cliquer sur le bouton ci-dessous.</p><div class="send-score-fields"><input type="text" id="${ids.first}" placeholder="Prénom" autocomplete="given-name"><input type="text" id="${ids.last}" placeholder="Nom" autocomplete="family-name"><select id="${ids.fm}">${options("Professeur de FM",teachers)}</select><select id="${ids.instrument}">${options("Professeur d’instrument",["Alexandre"])}</select></div><button id="${ids.send}" class="button" type="button">Envoyer mon résultat</button><p id="${ids.confirmation}" class="send-confirmation" aria-live="polite"></p><p id="${ids.loading}" class="send-loading" hidden>⏳ Envoi en cours…</p></details>`;
    host.dataset.ready = "true";
    host.dataset.kind = key ? "key" : "instrument";
  }
  function show(host, data) {
    if (!host) return;
    const key = host.dataset.kind === "key";
    const prefix = key ? "key-result-" : "result-";
    const title = document.getElementById(`${prefix}title`);
    const score = document.getElementById(`${prefix}score`);
    const text = document.getElementById(`${prefix}text`);
    const home = document.getElementById(key ? "key-result-home" : "result-home");
    if (title) title.textContent = data.title || "Bravo !";
    if (score) score.textContent = data.score || "";
    if (text) text.textContent = data.text || "Ton résultat est un repère personnel. Si tu choisis de le partager, ton professeur pourra t’accompagner dans la suite.";
    if (home && data.homeHref) home.href = data.homeHref;
    if (home && data.homeLabel) home.textContent = data.homeLabel;
    host.hidden = false;
  }
  window.LDNResultPanel = { render, show };
}());
