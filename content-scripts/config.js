// content-scripts/config.js
//
// IMPORTANTE: o Instagram usa classes CSS geradas automaticamente (hashes)
// que mudam a cada deploy da plataforma. Por isso, TODOS os seletores usados
// pela extensão ficam centralizados neste arquivo — se algo parar de
// funcionar, o primeiro lugar a checar (e corrigir) é aqui, não espalhado
// pelo código.
//
// Os seletores abaixo são um ponto de partida baseado em padrões conhecidos
// de acessibilidade do Instagram (aria-label, role, texto visível) — mais
// estáveis que classes, mas ainda assim precisam ser validados e ajustados
// contra o DOM real durante o desenvolvimento, inspecionando a página com
// as devtools do navegador.

/**
 * Configuração central de seletores DOM e strings usadas por todos os
 * módulos da extensão. Ver nota de topo do arquivo: qualquer ajuste
 * necessário por mudança de interface do Instagram deve começar aqui.
 *
 * @namespace REVERSA_CONFIG
 * @property {Object} feed - Seletores do feed principal.
 * @property {string} feed.mainSelector - Seletor do container `<main>`
 *   do feed. Estratégia: usar `role="main"`, mais estável que classes.
 * @property {string} feed.postSelector - Seletor de cada post
 *   individual dentro do feed (hoje `"article"`, tag semântica).
 *
 * @property {Object} feedSwitcher - Seletores do menu que alterna entre
 *   feed algorítmico e feed "Seguindo" (usado por chrono-feed.js).
 * @property {string} feedSwitcher.triggerSelector - Seletor do botão/
 *   ícone que abre esse menu. NÃO VALIDADO contra o DOM real ainda.
 * @property {string[]} feedSwitcher.followingOptionText - Textos
 *   (PT/EN) usados para localizar a opção "Seguindo" dentro do menu,
 *   como fallback mais robusto que depender de classes CSS.
 *
 * @property {Object} settings - Identificação das páginas de
 *   configuração relevantes para settings-reset.js.
 * @property {string} settings.notificationsUrlFragment - Trecho de URL
 *   que identifica a página de configurações de notificações.
 * @property {string} settings.autoplayUrlFragment - Trecho de URL que
 *   identifica a página de configurações de autoplay. Caminho exato
 *   NÃO CONFIRMADO — Instagram reorganiza esse menu com frequência.
 * @property {string} settings.toggleSelector - Seletor genérico para
 *   toggles de configuração (`[role="switch"]`, padrão de
 *   acessibilidade ARIA).
 *
 * @property {string} domPrefix - Prefixo (`reversa-ext`) usado em todo
 *   elemento injetado no DOM pela extensão, para evitar colisão com
 *   classes do Instagram e facilitar localizar/remover esses elementos.
 */
const REVERSA_CONFIG = {
  feed: {
    mainSelector: 'main[role="main"]',
    postSelector: "article",
  },

  feedSwitcher: {
    triggerSelector: '[aria-label*="Feed" i], svg[aria-label*="star" i]',
    followingOptionText: ["Seguindo", "Following"],
  },

  settings: {
    notificationsUrlFragment: "/accounts/push_notifications/",
    autoplayUrlFragment: "/accounts/media_playback/",
    toggleSelector: '[role="switch"]',
  },

  domPrefix: "reversa-ext",
};

// Deixa disponível para os outros content scripts (carregados na mesma
// página, na ordem definida no manifest.json).
window.REVERSA_CONFIG = REVERSA_CONFIG;
