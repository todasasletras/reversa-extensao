/**
 * background.js
 *
 * Script de fundo da extensão Reversa. Roda em segundo plano, sem UI
 * própria. Responsável apenas por garantir que existam valores padrão
 * no `browser.storage.local` na primeira instalação — cada content
 * script (ver content-scripts/index.js) lê esse storage para decidir
 * se deve agir ou não em cada página do Instagram.
 */

/**
 * Preferências padrão de cada módulo, gravadas no storage apenas na
 * primeira instalação da extensão.
 *
 * @property {boolean} scrollLimiter - Módulo 1: rolagem não infinita.
 *   Vem ativado por padrão.
 * @property {number} scrollLimiterMinutes - Quantos minutos de rolagem
 *   contínua o módulo 1 libera antes de pausar e pedir confirmação
 *   (padrão: 5). Configurável pelo slider no popup.
 * @property {boolean} adRemover - Módulo 2: feed cronológico.
 *   Desativado por padrão; usuário ativa pelo popup.
 * @property {boolean} followOnlyFilter - Módulo 3: mostrar apenas quem
 *   você segue. Desativado por padrão.
 * @property {boolean} autoplayReset - Módulo 4a: reversão de autoplay.
 *   Desativado por padrão.
 * @property {boolean} notificationsReset - Módulo 4b: reversão de
 *   notificações. Desativado por padrão.
 */
const DEFAULT_PREFS = {
  scrollLimiter: true,
  scrollLimiterMinutes: 5,
  adRemover: false,
  followOnlyFilter: false,
  autoplayReset: false,
  notificationsReset: false,
};

/**
 * Grava DEFAULT_PREFS no storage local, mas apenas quando o evento de
 * instalação é uma instalação nova (não uma atualização) — isso
 * preserva preferências que o usuário já tenha customizado em versões
 * anteriores da extensão.
 *
 * @listens browser.runtime.onInstalled
 * @param {Object} details - Detalhes do evento fornecidos pela API.
 * @param {string} details.reason - "install", "update" ou "browser_update".
 */
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await browser.storage.local.set({ prefs: DEFAULT_PREFS });
  }
});

/**
 * Responde a mensagens internas da extensão. Hoje só trata
 * "GET_DEFAULT_PREFS", devolvendo o objeto DEFAULT_PREFS.
 *
 * Não é chamado por nenhum outro arquivo ainda — deixado como ponto de
 * extensão para uma futura funcionalidade de "restaurar padrões" no
 * popup, por exemplo.
 *
 * @listens browser.runtime.onMessage
 * @param {{type: string}} message - Mensagem enviada por outro contexto
 *   da extensão (popup ou content script).
 * @param {Object} sender - Informações sobre quem enviou a mensagem.
 * @param {Function} sendResponse - Callback para responder à mensagem.
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_DEFAULT_PREFS") {
    sendResponse(DEFAULT_PREFS);
  }
});
