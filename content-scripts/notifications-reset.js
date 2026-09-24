// content-scripts/notifications-reset.js
//
// Módulo 4b — Reversão de notificações. Depende de
// content-scripts/settings-toggle-factory.js (carregado antes deste
// arquivo, ver manifest.json) para a lógica compartilhada de observar
// uma página de configuração e desativar seus toggles.
//
// TODO (equipe): o Instagram tem múltiplas categorias de notificação
// (curtidas, comentários, novos seguidores, mensagens etc.) na mesma
// página — hoje este módulo desativa TODOS os toggles ativos ali.
// Decidir se esse é o comportamento desejado ou se deveria haver
// granularidade (ex.: manter notificações de mensagens diretas ligadas).

/**
 * Módulo 4b — Reversão de notificações, com interface pública
 * `start`/`stop`. Independente do módulo de autoplay
 * (autoplay-reset.js) — pode ser ativado sozinho.
 *
 * @namespace ReversaNotificationsReset
 */
const ReversaNotificationsReset = createSettingsToggleModule(
  REVERSA_CONFIG.settings.notificationsUrlFragment
);

window.ReversaNotificationsReset = ReversaNotificationsReset;
