// content-scripts/scroll-limiter.js
//
// Módulo 1 — Rolagem não infinita.
// Modelo baseado em TEMPO (não em quantidade de posts): a partir do
// momento em que o feed é aberto (ou a rolagem é retomada), um
// temporizador conta os minutos configurados pelo usuário no popup
// (slider). Ao esgotar o tempo, a rolagem é travada e um overlay pede
// confirmação consciente para continuar.

/**
 * Módulo 1 — Rolagem não infinita, como IIFE que expõe uma interface
 * pública mínima (`start`/`stop`). Estado interno (timer, minutos
 * configurados, flag de pausa) fica fechado no escopo, inacessível de
 * fora.
 *
 * @namespace ReversaScrollLimiter
 */
const ReversaScrollLimiter = (() => {
  /** @type {number|null} ID do setTimeout ativo, ou null se parado. */
  let timerId = null;
  /** @type {number} Minutos de rolagem liberados antes de pausar (configurável via start()). */
  let minutes = 5;
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
    const minuteLabel = minutes === 1 ? "minuto" : "minutos";
    message.textContent = `Você já usou ${minutes} ${minuteLabel} nesta sessão de rolagem.`;

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
   * Agenda (ou reagenda) o disparo de `pauseScroll()` para daqui a
   * `minutes` minutos. Chamada tanto por `start()` quanto por
   * `resume()`, para que cada "Continuar rolando" comece uma nova
   * contagem completa.
   * @returns {void}
   */
  function scheduleTimer() {
    clearTimeout(timerId);
    timerId = setTimeout(pauseScroll, minutes * 60 * 1000);
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
   * Libera a rolagem, remove o overlay do DOM e reinicia a contagem de
   * tempo do zero. Chamada pelo clique no botão "Continuar rolando".
   * @returns {void}
   */
  function resume() {
    paused = false;
    document.documentElement.style.overflow = "";
    const overlay = document.getElementById(
      `${REVERSA_CONFIG.domPrefix}-scroll-overlay`
    );
    if (overlay) overlay.remove();
    scheduleTimer();
  }

  /**
   * Ponto de entrada do módulo: define os minutos configurados e agenda
   * o temporizador inicial. Idempotente: não reagenda se já houver um
   * timer ativo (evita reiniciar a contagem sempre que `applyPrefs` for
   * chamado de novo com o módulo já ligado).
   * @param {number} [configuredMinutes] - Minutos de rolagem liberados
   *   antes de pausar. Se omitido, mantém o valor atual de `minutes`.
   * @returns {void}
   */
  function start(configuredMinutes) {
    if (Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
      minutes = configuredMinutes;
    }
    if (timerId) return; // já rodando
    scheduleTimer();
  }

  /**
   * Desativa o módulo: cancela o temporizador ativo e libera a
   * rolagem, garantindo que a página não fique travada se estava
   * pausada no momento da desativação.
   * @returns {void}
   */
  function stop() {
    clearTimeout(timerId);
    timerId = null;
    paused = false;
    document.documentElement.style.overflow = "";
    const overlay = document.getElementById(
      `${REVERSA_CONFIG.domPrefix}-scroll-overlay`
    );
    if (overlay) overlay.remove();
  }

  return { start, stop };
})();

window.ReversaScrollLimiter = ReversaScrollLimiter;
