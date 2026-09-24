// content-scripts/autoplay-reset.js
//
// Módulo 4a — Reversão de autoplay. Depende de
// content-scripts/settings-toggle-factory.js (carregado antes deste
// arquivo, ver manifest.json) para a lógica compartilhada de observar
// uma página de configuração e desativar seus toggles.
//
// TODO (equipe): confirmar o caminho exato da página de autoplay do
// Instagram (REVERSA_CONFIG.settings.autoplayUrlFragment) — o Instagram
// reorganiza esse menu com frequência.

/**
 * Módulo 4a — Reversão de autoplay, com interface pública
 * `start`/`stop`. Independente do módulo de notificações
 * (notifications-reset.js) — pode ser ativado sozinho.
 *
 * @namespace ReversaAutoplayReset
 */
const ReversaAutoplayReset = createSettingsToggleModule(
  REVERSA_CONFIG.settings.autoplayUrlFragment
);

window.ReversaAutoplayReset = ReversaAutoplayReset;
