// content-scripts/chrono-feed.js
//
// Módulo 2 — Feed cronológico.
// Abordagem escolhida: em vez de reconstruir o feed do zero (frágil e
// caro), a extensão automatiza o clique na opção nativa "Seguindo" que o
// próprio Instagram já oferece no menu de alternância de feed — o
// Instagram volta para o feed algorítmico por padrão a cada nova sessão,
// então a extensão repete esse clique automaticamente.
//
// TODO (equipe): validar o seletor real de REVERSA_CONFIG.feedSwitcher
// inspecionando o DOM do Instagram, e ajustar aqui se o menu tiver mais de
// um clique (ex.: abrir menu -> clicar na opção -> menu fecha sozinho).

/**
 * Módulo 2 — Feed cronológico, como IIFE com interface pública
 * `start`/`stop`.
 *
 * @namespace ReversaChronoFeed
 */
const ReversaChronoFeed = (() => {
  /** @type {number|null} ID do setInterval ativo, ou null se parado. */
  let intervalId = null;

  /**
   * Procura, entre `div`, `span` e `a` da página, o elemento cujo texto
   * visível corresponde exatamente (case-insensitive) a um dos textos
   * em `REVERSA_CONFIG.feedSwitcher.followingOptionText` (ex.:
   * "Seguindo" / "Following").
   * @returns {Element|undefined} O elemento encontrado, ou undefined.
   */
  function findFollowingOption() {
    const { followingOptionText } = REVERSA_CONFIG.feedSwitcher;
    const candidates = Array.from(document.querySelectorAll("div, span, a"));
    return candidates.find((el) =>
      followingOptionText.some(
        (text) => el.textContent?.trim().toLowerCase() === text.toLowerCase()
      )
    );
  }

  /**
   * Tenta alternar o feed para a visualização "Seguindo" em dois
   * passos: (1) clica no trigger que abre o menu de alternância de
   * feed; (2) procura e clica na opção "Seguindo" dentro do menu.
   * Não lança erro se algum dos elementos não for encontrado — apenas
   * não faz nada nesse ciclo (tentará de novo no próximo intervalo).
   * @returns {void}
   */
  function trySwitchToFollowing() {
    const trigger = document.querySelector(
      REVERSA_CONFIG.feedSwitcher.triggerSelector
    );
    trigger?.click();

    const option = findFollowingOption();
    option?.click();
  }

  /**
   * Ponto de entrada do módulo: inicia um intervalo de 3s que tenta
   * repetidamente alternar para o feed "Seguindo". A repetição (em vez
   * de uma única tentativa) existe porque o menu só existe depois que
   * a SPA termina de montar, e pode precisar ser refeito em navegações
   * internas do Instagram sem reload de página.
   * Idempotente: não faz nada se já houver um intervalo ativo.
   * @returns {void}
   */
  function start() {
    if (intervalId) return;
    intervalId = setInterval(trySwitchToFollowing, 3000);
  }

  /**
   * Desativa o módulo, limpando o intervalo ativo.
   * @returns {void}
   */
  function stop() {
    clearInterval(intervalId);
    intervalId = null;
  }

  return { start, stop };
})();

window.ReversaChronoFeed = ReversaChronoFeed;
