// content-scripts/index.js
//
// Ponto de entrada do content script: lê as preferências salvas no
// storage e liga/desliga cada módulo de acordo. Reage também a mudanças
// feitas no popup em tempo real (browser.storage.onChanged).

/**
 * Liga ou desliga cada um dos 4 módulos com base no objeto de
 * preferências. Único lugar do projeto que decide o estado de cada
 * módulo — os módulos em si nunca se autoativam. Módulos são
 * completamente independentes entre si: qualquer combinação de
 * `true`/`false` é válida.
 * @param {Object} prefs - Preferências lidas do storage (ver
 *   background.js para o formato de DEFAULT_PREFS).
 * @param {boolean} prefs.scrollLimiter - Liga/desliga o módulo 1.
 * @param {number} [prefs.scrollLimiterBatchSize] - Repassado ao
 *   `start()` do módulo 1.
 * @param {boolean} prefs.chronoFeed - Liga/desliga o módulo 2.
 * @param {boolean} prefs.followOnlyFilter - Liga/desliga o módulo 3.
 * @param {boolean} prefs.settingsReset - Liga/desliga o módulo 4.
 * @returns {void}
 */
function applyPrefs(prefs) {
  if (prefs.scrollLimiter) {
    ReversaScrollLimiter.start(prefs.scrollLimiterBatchSize);
  } else {
    ReversaScrollLimiter.stop();
  }

  if (prefs.chronoFeed) {
    ReversaChronoFeed.start();
  } else {
    ReversaChronoFeed.stop();
  }

  if (prefs.followOnlyFilter) {
    ReversaFollowOnlyFilter.start();
  } else {
    ReversaFollowOnlyFilter.stop();
  }

  if (prefs.settingsReset) {
    ReversaSettingsReset.start();
  } else {
    ReversaSettingsReset.stop();
  }
}

/**
 * Lê as preferências salvas em `browser.storage.local` e aplica o
 * estado inicial de cada módulo. Chamada uma vez, na carga do content
 * script.
 * @returns {Promise<void>}
 */
async function init() {
  const { prefs } = await browser.storage.local.get("prefs");
  if (prefs) applyPrefs(prefs);
}

/**
 * Reage a mudanças de preferência feitas em tempo real (ex.: pelo
 * popup), sem precisar recarregar a página do Instagram.
 * @listens browser.storage.onChanged
 * @param {Object} changes - Mudanças detectadas, chaveadas por nome.
 * @param {string} area - Área do storage alterada ("local", "sync" etc.).
 * @returns {void}
 */
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.prefs) return;
  applyPrefs(changes.prefs.newValue);
});

init();
