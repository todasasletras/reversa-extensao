// content-scripts/settings-reset.js
//
// Módulo 4 — Reversão de autoplay e notificações.
// Este é o módulo com maior dependência de páginas de configuração do
// Instagram (as mais sujeitas a mudança de layout). A estratégia é:
// 1. Só age quando o usuário está numa página de configurações relevante
//    (ver REVERSA_CONFIG.settings) — não navega sozinho até lá, por
//    respeito e para reduzir comportamento inesperado.
// 2. Quando está, procura os toggles relevantes e garante que estejam na
//    posição "desativado".
//
// TODO (equipe): validar em quais rotas exatas do Instagram esses toggles
// aparecem hoje, e se há mais de um toggle por página (ex. notificações
// tem várias categorias: curtidas, comentários, seguidores etc.) — nesse
// caso, decidir se a extensão desativa todas ou só as mais "ruidosas".

/**
 * Módulo 4 — Reversão de autoplay e notificações, como IIFE com
 * interface pública `start`/`stop`. O módulo com maior dependência de
 * páginas de configuração do Instagram, e por isso o mais sujeito a
 * quebrar com mudanças de interface.
 *
 * @namespace ReversaSettingsReset
 */
const ReversaSettingsReset = (() => {
  /** @type {MutationObserver|null} Observer ativo do body, ou null se parado. */
  let observer = null;

  /**
   * Verifica se a URL atual corresponde a uma página de configuração
   * relevante (notificações ou autoplay), com base nos fragmentos
   * definidos em REVERSA_CONFIG.settings.
   * @returns {boolean} true se a página atual for relevante.
   */
  function isRelevantSettingsPage() {
    const { notificationsUrlFragment, autoplayUrlFragment } =
      REVERSA_CONFIG.settings;
    return (
      location.pathname.includes(notificationsUrlFragment) ||
      location.pathname.includes(autoplayUrlFragment)
    );
  }

  /**
   * Se a página atual for relevante, percorre todos os toggles
   * (`[role="switch"]`) e clica nos que estiverem ativados
   * (`aria-checked="true"`), desativando-os. Não faz nada em páginas
   * não relevantes — o módulo nunca navega sozinho até uma página de
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
   * já desativados — desligar o módulo não deveria reativar
   * notificações que o usuário já tinha desligado.
   * @returns {void}
   */
  function stop() {
    observer?.disconnect();
    observer = null;
  }

  return { start, stop };
})();

window.ReversaSettingsReset = ReversaSettingsReset;
