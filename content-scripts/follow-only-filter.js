// content-scripts/follow-only-filter.js
//
// Módulo 3 — Mostrar apenas quem você segue.
// Independente do módulo de feed cronológico (ver chrono-feed.js): aqui o
// objetivo é ocultar do DOM qualquer post que a extensão identifique como
// "sugerido" / fora da rede de contas seguidas, mantendo a ordem que o
// Instagram entregar (algorítmica ou cronológica).
//
// LIMITAÇÃO CONHECIDA (documentar na demo): o Instagram nem sempre marca
// explicitamente no DOM se um post é "sugerido". Quando existe, costuma
// aparecer como um texto tipo "Sugestão para você" acima do post — esse é
// o sinal mais confiável disponível sem depender de API privada. Se esse
// texto não for encontrado, o post é mantido visível por padrão (a
// extensão erra para o lado de não esconder demais).

/**
 * Módulo 3 — Mostrar apenas quem você segue, como IIFE com interface
 * pública `start`/`stop`. Independente do módulo de feed cronológico
 * (chrono-feed.js) — pode ser ativado sozinho ou em conjunto.
 *
 * @namespace ReversaFollowOnlyFilter
 */
const ReversaFollowOnlyFilter = (() => {
  /** @type {MutationObserver|null} Observer ativo do feed, ou null se parado. */
  let observer = null;

  /**
   * Textos usados como sinal de que um post é uma sugestão do
   * algoritmo, não de uma conta seguida. Limitação conhecida: o
   * Instagram nem sempre marca isso explicitamente no DOM — quando o
   * rótulo não é encontrado, o post é mantido visível por padrão
   * (a extensão erra para o lado de esconder de menos).
   * @type {string[]}
   */
  const SUGGESTED_LABELS = ["Sugestão para você", "Suggested for you"];

  /**
   * Verifica se um elemento de post contém algum dos rótulos de
   * conteúdo sugerido.
   * @param {Element} postEl - Elemento do post a verificar.
   * @returns {boolean} true se o post for identificado como sugerido.
   */
  function isSuggestedPost(postEl) {
    const text = postEl.textContent || "";
    return SUGGESTED_LABELS.some((label) => text.includes(label));
  }

  /**
   * Percorre todos os posts dentro de `root` e esconde
   * (`display: none`) os identificados como sugeridos, marcando-os com
   * `dataset.reversaHidden = "true"` para permitir reverter depois.
   * @param {Document|Element} [root=document] - Escopo da busca por
   *   posts. Usado para aplicar o filtro só em nós recém-adicionados,
   *   em vez de reprocessar o documento inteiro a cada mutação.
   * @returns {void}
   */
  function applyFilter(root = document) {
    root
      .querySelectorAll(REVERSA_CONFIG.feed.postSelector)
      .forEach((post) => {
        if (isSuggestedPost(post)) {
          post.dataset.reversaHidden = "true";
          post.style.display = "none";
        }
      });
  }

  /**
   * Callback do MutationObserver: aplica o filtro em cada nó recém-
   * adicionado ao feed.
   * @param {MutationRecord[]} mutationsList - Mutações do DOM
   *   observadas desde a última chamada.
   * @returns {void}
   */
  function handleMutations(mutationsList) {
    for (const mutation of mutationsList) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        applyFilter(node.matches ? node : document);
      });
    }
  }

  /**
   * Ponto de entrada do módulo: aplica o filtro nos posts já presentes
   * na página e inicia o MutationObserver para novos posts. Se o feed
   * ainda não tiver carregado, tenta novamente em 1 segundo.
   * Idempotente: não faz nada se já houver um observer ativo.
   * @returns {void}
   */
  function start() {
    if (observer) return;
    applyFilter();
    const main = document.querySelector(REVERSA_CONFIG.feed.mainSelector);
    if (!main) {
      setTimeout(start, 1000);
      return;
    }
    observer = new MutationObserver(handleMutations);
    observer.observe(main, { childList: true, subtree: true });
  }

  /**
   * Desativa o módulo: desconecta o observer e reexibe todos os posts
   * que haviam sido escondidos (marcados com
   * `data-reversa-hidden="true"`).
   * @returns {void}
   */
  function stop() {
    observer?.disconnect();
    observer = null;
    document
      .querySelectorAll('[data-reversa-hidden="true"]')
      .forEach((post) => {
        post.style.display = "";
        delete post.dataset.reversaHidden;
      });
  }

  return { start, stop };
})();

window.ReversaFollowOnlyFilter = ReversaFollowOnlyFilter;
