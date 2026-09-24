/**
 * Módulo 2 — Feed algorítmico sem anúncios, como IIFE com interface pública
 * `start`/`stop`.
 *
 * @namespace ReversaAdRemover
 */
const ReversaAdRemover = (() => {
  /** @type {number|null} ID do setInterval ativo, ou null se parado. */
  let intervalId = null;
  console.log("ReversaAdRemover", this);

  /**
   * Procura, entre `div`, `span` e `a` da página, o elemento cujo texto
   * visível corresponde exatamente (case-insensitive) a um dos textos
   * em `REVERSA_CONFIG.feedSwitcher.postOptionText` (ex.:
   * "Patrocinado" / "Sponsored" / "Ad").
   * @returns {Element|undefined} O elemento encontrado, ou undefined.
   */
  function findSponsoredOption() {
    const { postOptionText } = REVERSA_CONFIG.feedSwitcher;
    const posts = Array.from(document.querySelectorAll("article"));
    const candidates = posts.flatMap((el) => Array.from(el.querySelectorAll("span")));
    console.log("candidates", candidates);
    return posts.find((el) =>
      postOptionText.some(
        (text) => el.textContent?.trim().toLowerCase() === text.toLowerCase()
      )
    );
  }

  /**
   * Tenta alternar o feed para a visualização "Patrocinado" em dois
   * passos: (1) clica no trigger que abre o menu de alternância de
   * feed; (2) procura e clica na opção "Patrocinado" dentro do menu.
   * Não lança erro se algum dos elementos não for encontrado — apenas
   * não faz nada nesse ciclo (tentará de novo no próximo intervalo).
   * @returns {void}
   */
  function tryRemoveSponsoreds() {
    const trigger = document.querySelector(
      REVERSA_CONFIG.feedSwitcher.triggerSelector
    );
    trigger?.click();

    const option = findSponsoredOption();
    option?.click();
  }

  /**
   * Ponto de entrada do módulo: inicia um intervalo de 3s que tenta
   * repetidamente alternar para o feed sem "Patrocinados". A repetição (em vez
   * de uma única tentativa) existe porque o menu só existe depois que
   * a SPA termina de montar, e pode precisar ser refeito em navegações
   * internas do Instagram sem reload de página.
   * Idempotente: não faz nada se já houver um intervalo ativo.
   * @returns {void}
   */
  function start() {
    console.log("ReversaAdRemover.start");
    if (intervalId) return;
    intervalId = setInterval(tryRemoveSponsoreds, 3000);
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

window.ReversaAdRemover = ReversaAdRemover;
