// popup/popup.js
// Sincroniza os checkboxes do popup com browser.storage.local.prefs.
// Qualquer mudança aqui é lida em tempo real pelos content scripts via
// browser.storage.onChanged (ver content-scripts/index.js).

/**
 * IDs dos 4 checkboxes do popup, correspondendo às chaves usadas no
 * objeto de preferências (ver background.js DEFAULT_PREFS). Usado
 * tanto para carregar quanto para salvar, evitando repetir a lista.
 * @type {string[]}
 */
const TOGGLE_IDS = [
  "scrollLimiter",
  "chronoFeed",
  "followOnlyFilter",
  "settingsReset",
];

/**
 * Lê as preferências salvas e marca cada checkbox conforme o valor
 * correspondente. Chamada uma vez, na abertura do popup.
 * @returns {Promise<void>}
 */
async function loadPrefs() {
  const { prefs } = await browser.storage.local.get("prefs");
  if (!prefs) return;
  TOGGLE_IDS.forEach((id) => {
    document.getElementById(id).checked = Boolean(prefs[id]);
  });
}

/**
 * Salva o novo valor de uma preferência específica, fazendo merge com
 * as preferências existentes — importante para não sobrescrever/perder
 * o estado dos outros módulos.
 * @param {string} id - Chave da preferência a atualizar (um dos
 *   TOGGLE_IDS).
 * @param {boolean} value - Novo valor (checked do checkbox).
 * @returns {Promise<void>}
 */
async function savePref(id, value) {
  const { prefs } = await browser.storage.local.get("prefs");
  const updated = { ...prefs, [id]: value };
  await browser.storage.local.set({ prefs: updated });
}

// Registra um listener de "change" por checkbox, salvando a mudança
// assim que o usuário clica.
TOGGLE_IDS.forEach((id) => {
  document.getElementById(id).addEventListener("change", (event) => {
    savePref(id, event.target.checked);
  });
});

loadPrefs();
