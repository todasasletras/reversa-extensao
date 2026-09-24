/**
 * Módulo 3 — Mostrar apenas quem você segue, como IIFE com interface
 * pública `start`/`stop`.
 *
 * @namespace ReversaFollowOnlyFilter
 */
const ReversaFollowOnlyFilter = (() => {
  /** @type {number|null} ID do setInterval ativo, ou null se parado. */
  let intervalId = null;

  /** @type {string} Nome do parâmetro de URL que seleciona o feed. */
  const FOLLOWING_PARAM = "variant";

  /** @type {string} Valor do parâmetro que ativa o feed "Seguindo". */
  const FOLLOWING_VALUE = "following";

  /**
   * Verifica se a página atual é o feed principal (página inicial).
   * @returns {boolean} true se estiver na raiz do Instagram.
   */
  function isHomeFeed() {
    return location.pathname === "/";
  }

  /**
   * Se estiver no feed principal sem `?variant=following`, redireciona
   * para a mesma URL com o parâmetro. Usa `location.replace` para não
   * deixar a URL do feed algorítmico no histórico (evita loop ao usar
   * o botão Voltar).
   * @returns {void}
   */
  function ensureFollowingVariant() {
    if (!isHomeFeed()) return;
    const url = new URL(location.href);
    if (url.searchParams.get(FOLLOWING_PARAM) === FOLLOWING_VALUE) return;
    url.searchParams.set(FOLLOWING_PARAM, FOLLOWING_VALUE);
    location.replace(url.href);
  }

  /**
   * Ponto de entrada do módulo: aplica o redirecionamento imediatamente
   * e inicia um intervalo de 1s que repete a verificação. A repetição
   * existe porque o Instagram é uma SPA — navegações internas de volta
   * à página inicial (ex.: clique no logo) não recarregam a página, e o
   * content script roda em mundo isolado, sem acesso ao `pushState` da
   * página.
   * Idempotente: não faz nada se já houver um intervalo ativo.
   * @returns {void}
   */
  function start() {
    if (intervalId) return;
    ensureFollowingVariant();
    intervalId = setInterval(ensureFollowingVariant, 1000);
  }

  /**
   * Desativa o módulo, limpando o intervalo ativo. Não navega de volta
   * para o feed algorítmico — apenas deixa de redirecionar.
   * @returns {void}
   */
  function stop() {
    clearInterval(intervalId);
    intervalId = null;
  }

  return { start, stop };
})();

window.ReversaFollowOnlyFilter = ReversaFollowOnlyFilter;
