/**
 * Módulo 2 — Feed algorítmico sem anúncios, como IIFE com interface pública
 * `start`/`stop`.
 *
 * @namespace ReversaAdRemover
 */
const ReversaAdRemover = (() => {
  /** @type {number|null} ID do setInterval ativo, ou null se parado. */
  let intervalId = null;
  console.log("ReversaAdRemover");

  /**
   * Procura, entre `div`, `span` e `a` da página, o elemento cujo texto
   * visível corresponde exatamente (case-insensitive) a um dos textos
   * em `REVERSA_CONFIG.feedSwitcher.sponsoredPostText` (ex.:
   * "Patrocinado" / "Sponsored" / "Ad").
   * @returns {Element|undefined} O elemento encontrado, ou undefined.
   */
  function findSponsoredOption() {
    const TERMS = new Set(REVERSA_CONFIG.feedSwitcher.sponsoredPostText);
    const posts = Array.from(document.querySelectorAll("article"));
    const candidates = posts.flatMap((el) => Array.from(el.querySelectorAll("span")));
    console.log("candidates", candidates);
    const sponsored = candidates.filter((span) =>
      TERMS.has(span.textContent.trim())
    );
    console.log("sponsored", sponsored);
    return sponsored;
  }
  
  function hideSponsoredPosts() {
    const sponsoredSpans = findSponsoredOption(); // retorna o array do filter

    const articles = new Set(
      sponsoredSpans
        .map((span) => span.closest("article"))
        .filter(Boolean) // descarta null, caso algum span não esteja num article
    );

    articles.forEach((article) => {
      //article.style.setProperty("visibility", "collapse", "important");
      article.style.setProperty("background", "red", "important");
      //article.dataset.reversaHidden = "true";
    });

    return articles.size;
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
    intervalId = setInterval(hideSponsoredPosts, 3000);
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
