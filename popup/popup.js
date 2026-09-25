// popup/popup.js
// Sincroniza os checkboxes do popup com browser.storage.local.prefs.
// Qualquer mudança aqui é lida em tempo real pelos content scripts via
// browser.storage.onChanged (ver content-scripts/index.js).

/**
 * IDs dos 5 checkboxes do popup, correspondendo às chaves booleanas
 * usadas no objeto de preferências (ver background.js DEFAULT_PREFS).
 * Usado tanto para carregar quanto para salvar, evitando repetir a
 * lista. Não inclui `scrollLimiterMinutes`, que é numérico e tratado
 * separadamente pelo slider.
 * @type {string[]}
 */
const TOGGLE_IDS = [
  "scrollLimiter",
  "adRemover",
  "followOnlyFilter",
  "autoplayReset",
  "notificationsReset",
];

const minutesSlider = document.getElementById("scrollLimiterMinutes");
const minutesValueLabel = document.getElementById(
  "scrollLimiterMinutesValue"
);
const minutesSliderRow = document.getElementById("scrollLimiterSliderRow");
const scrollLimiterCheckbox = document.getElementById("scrollLimiter");

/**
 * Habilita/desabilita visualmente o slider de minutos conforme o
 * toggle de rolagem não infinita está ligado ou desligado — não faz
 * sentido configurar um tempo para um módulo desativado.
 * @param {boolean} enabled
 * @returns {void}
 */
function setSliderEnabled(enabled) {
  minutesSliderRow.classList.toggle("disabled", !enabled);
}

/**
 * Lê as preferências salvas e aplica aos 5 checkboxes e ao slider de
 * minutos. Chamada uma vez, na abertura do popup.
 * @returns {Promise<void>}
 */
async function loadPrefs() {
  const { prefs } = await browser.storage.local.get("prefs");
  if (!prefs) return;
  TOGGLE_IDS.forEach((id) => {
    document.getElementById(id).checked = Boolean(prefs[id]);
  });
  const minutes = prefs.scrollLimiterMinutes || 5;
  minutesSlider.value = minutes;
  minutesValueLabel.textContent = `${minutes} min`;
  setSliderEnabled(Boolean(prefs.scrollLimiter));
}

/**
 * Recarrega a aba ativa, se ela for do Instagram, para que os content
 * scripts reiniciem já com as preferências novas.
 * @returns {Promise<void>}
 */
async function reloadActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  if (!tab.url?.startsWith("https://www.instagram.com/")) return;
  await browser.tabs.reload(tab.id);
}

/**
 * Salva o novo valor de uma preferência específica, fazendo merge com
 * as preferências existentes — importante para não sobrescrever/perder
 * o estado dos outros módulos.
 * @param {string} id - Chave da preferência a atualizar.
 * @param {boolean|number} value - Novo valor.
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
  document.getElementById(id).addEventListener("change", async (event) => {
    await savePref(id, event.target.checked);
    await reloadActiveTab();
  });
});

// O toggle de rolagem também controla se o slider fica habilitado.
scrollLimiterCheckbox.addEventListener("change", (event) => {
  setSliderEnabled(event.target.checked);
});

// Atualiza o rótulo em tempo real enquanto o usuário arrasta o slider,
// e só salva no storage quando ele solta (evita gravar a cada pixel).
minutesSlider.addEventListener("input", (event) => {
  minutesValueLabel.textContent = `${event.target.value} min`;
});
minutesSlider.addEventListener("change", (event) => {
  savePref("scrollLimiterMinutes", Number(event.target.value));
});

loadPrefs();
