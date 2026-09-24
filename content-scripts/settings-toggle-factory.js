// content-scripts/settings-toggle-factory.js
//
// Fábrica compartilhada pelos módulos 4a (autoplay) e 4b (notificações).
// Os dois têm exatamente a mesma lógica — "nesta página de configuração
// específica, desative todos os toggles ativos" — mudando apenas QUAL
// página cada um observa. Em vez de duplicar esse código em dois
// arquivos, esta função cria um módulo independente (com seu próprio
// `start`/`stop`) a partir de um fragmento de URL.
//
// Cada modulo criado por esta fábrica é independente dos demais: dois
// módulos podem rodar ao mesmo tempo, cada um com seu próprio
// MutationObserver, sem interferir um no outro.

/**
 * Cria um módulo de reversão de configuração ligado a uma página
 * específica do Instagram.
 *
 * @param {string} urlFragment - Trecho de URL que identifica a página
 *   de configuração relevante para este módulo (ex.:
 *   REVERSA_CONFIG.settings.autoplayUrlFragment).
 * @returns {{start: function(): void, stop: function(): void}} Interface
 *   pública do módulo criado.
 */
function createSettingsToggleModule(urlFragment) {
  /** @type {MutationObserver|null} Observer ativo do body, ou null se parado. */
  let observer = null;

  /**
   * Verifica se a URL atual corresponde à página de configuração que
   * este módulo observa.
   * @returns {boolean}
   */
  function isRelevantSettingsPage() {
    return location.pathname.includes(urlFragment);
  }

  /**
   * Se a página atual for relevante, percorre todos os toggles
   * (`[role="switch"]`) e clica nos que estiverem ativados
   * (`aria-checked="true"`), desativando-os. Não faz nada em páginas
   * não relevantes — o módulo nunca navega sozinho até a página de
   * configuração, só age se o usuário já estiver nela.
   * @returns {void}
   */
  function disableActiveToggles() {
    if (!isRelevantSettingsPage()) return;
    document
      .querySelectorAll(REVERSA_CONFIG.settings.toggleSelector)
      .forEach((toggle) => {
        const isOn = toggle.getAttribute("aria-checked") === "true";
        if (isOn) {
          toggle.click();
        }
      });
  }

  /**
   * Ponto de entrada do módulo: roda `disableActiveToggles()`
   * imediatamente e observa mudanças no `document.body` inteiro (não
   * só no feed), porque as páginas de configuração também são SPA e
   * podem trocar de conteúdo sem reload de página.
   * Idempotente: não faz nada se já houver um observer ativo.
   * @returns {void}
   */
  function start() {
    if (observer) return;
    disableActiveToggles();
    observer = new MutationObserver(() => disableActiveToggles());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Desativa o módulo, desconectando o observer. Não reverte toggles
   * já desativados — desligar o módulo não deveria reativar algo que
   * o usuário já tinha desligado.
   * @returns {void}
   */
  function stop() {
    observer?.disconnect();
    observer = null;
  }

  return { start, stop };
}

window.createSettingsToggleModule = createSettingsToggleModule;
