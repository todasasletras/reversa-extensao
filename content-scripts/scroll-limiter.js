// content-scripts/scroll-limiter.js
//
// Módulo 1 — Rolagem não infinita.
// Conta quantos posts novos aparecem no feed via MutationObserver e, a
// cada N posts (configurável), bloqueia a rolagem e mostra um overlay
// pedindo confirmação consciente para continuar.

/**
 * Módulo 1 — Rolagem não infinita, como IIFE que expõe uma interface
 * pública mínima (`start`/`stop`). Estado interno (observer, contador,
 * flag de pausa) fica fechado no escopo, inacessível de fora.
 *
 * @namespace ReversaScrollLimiter
 */
const ReversaScrollLimiter = (() => {
  /** @type {MutationObserver|null} Observer ativo do feed, ou null se parado. */
  let observer = null;
  /** @type {number} Posts novos vistos desde a última pausa. */
  let postsSeenSinceLastPause = 0;
  /** @type {number} Quantos posts liberar antes de pausar (configurável via start()). */
  let batchSize = 10;
  /** @type {boolean} Se a rolagem está travada aguardando confirmação do usuário. */
  let paused = false;

  /**
   * Cria e insere no DOM o overlay de pausa (card com mensagem e botão
   * "Continuar rolando"). O clique no botão chama `resume()`.
   * @returns {void}
   */
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = `${REVERSA_CONFIG.domPrefix}-scroll-overlay`;
    // Montado via DOM (e não innerHTML) para não interpretar valores
    // dinâmicos como HTML — exigência do web-ext lint / revisão da AMO.
    const card = document.createElement("div");
    card.className = `${REVERSA_CONFIG.domPrefix}-overlay-card`;

    const message = document.createElement("p");
    message.textContent = `Você já viu ${batchSize} posts nesta sessão de rolagem.`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `${REVERSA_CONFIG.domPrefix}-continue-btn`;
    button.textContent = "Continuar rolando";
    button.addEventListener("click", resume);

    card.append(message, button);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  /**
   * Trava a rolagem da página e exibe o overlay de confirmação.
   * Idempotente: não faz nada se já estiver pausado.
   * @returns {void}
   */
  function pauseScroll() {
    if (paused) return;
    paused = true;
    document.documentElement.style.overflow = "hidden";
    createOverlay();
  }

  /**
   * Libera a rolagem, zera o contador de posts e remove o overlay do
   * DOM. Chamada tanto pelo clique no botão quanto por `stop()`, para
   * garantir que a página nunca fique travada com o módulo desativado.
   * @returns {void}
   */
  function resume() {
    paused = false;
    postsSeenSinceLastPause = 0;
    document.documentElement.style.overflow = "";
    const overlay = document.getElementById(
      `${REVERSA_CONFIG.domPrefix}-scroll-overlay`
    );
    if (overlay) overlay.remove();
  }

  /**
   * Callback do MutationObserver. Conta quantos posts novos foram
   * adicionados ao feed e pausa a rolagem ao atingir `batchSize`.
   * Não processa mutações enquanto já pausado.
   * @param {MutationRecord[]} mutationsList - Lista de mutações do DOM
   *   observadas desde a última chamada.
   * @returns {void}
   */
  function handleMutations(mutationsList) {
    if (paused) return;
    let newPosts = 0;
    for (const mutation of mutationsList) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (
          node.matches?.(REVERSA_CONFIG.feed.postSelector) ||
          node.querySelectorAll?.(REVERSA_CONFIG.feed.postSelector).length
        ) {
          newPosts += 1;
        }
      });
    }
    if (newPosts === 0) return;
    postsSeenSinceLastPause += newPosts;
    if (postsSeenSinceLastPause >= batchSize) {
      pauseScroll();
    }
  }

  /**
   * Ponto de entrada do módulo: localiza o container do feed e inicia
   * o MutationObserver. Se o feed ainda não tiver carregado (comum em
   * SPA logo após navegação), tenta novamente em 1 segundo.
   * Idempotente: não faz nada se já houver um observer ativo.
   * @param {number} [configuredBatchSize] - Quantos posts liberar antes
   *   de pausar. Se omitido, mantém o valor atual de `batchSize`.
   * @returns {void}
   */
  function start(configuredBatchSize) {
    if (observer) return; // já rodando
    batchSize = configuredBatchSize || batchSize;
    const main = document.querySelector(REVERSA_CONFIG.feed.mainSelector);
    if (!main) {
      setTimeout(() => start(batchSize), 1000);
      return;
    }
    observer = new MutationObserver(handleMutations);
    observer.observe(main, { childList: true, subtree: true });
  }

  /**
   * Desativa o módulo: desconecta o observer e chama `resume()` para
   * garantir que a página não fique travada se estava pausada no
   * momento da desativação.
   * @returns {void}
   */
  function stop() {
    observer?.disconnect();
    observer = null;
    resume();
  }

  return { start, stop };
})();

window.ReversaScrollLimiter = ReversaScrollLimiter;
