# Documentação técnica — Reversa

Referência arquivo por arquivo do código existente até o momento. Para
visão geral de arquitetura, setup e roadmap, ver `README.md` — este
documento entra em mais detalhe sobre o que cada função faz, por que foi
escrita assim, e o que ainda está pendente de validação.

Índice:
- [manifest.json](#manifestjson)
- [background.js](#backgroundjs)
- [content-scripts/config.js](#content-scriptsconfigjs)
- [content-scripts/scroll-limiter.js](#content-scriptsscroll-limiterjs)
- [content-scripts/ad-remover.js](#content-scriptsad-removerjs)
- [content-scripts/follow-only-filter.js](#content-scriptsfollow-only-filterjs)
- [content-scripts/settings-toggle-factory.js](#content-scriptssettings-toggle-factoryjs)
- [content-scripts/autoplay-reset.js](#content-scriptsautoplay-resetjs)
- [content-scripts/notifications-reset.js](#content-scriptsnotifications-resetjs)
- [content-scripts/index.js](#content-scriptsindexjs)
- [content-scripts/overlay.css](#content-scriptsoverlaycss)
- [popup/popup.html, popup.js, popup.css](#popup)
- [icons/](#icons)

---

## manifest.json

Manifesto da extensão, no formato **Manifest V2** — escolha deliberada
para garantir compatibilidade imediata com Firefox para Android (o
suporte a MV3 no Android é mais recente e ainda menos testado no
ecossistema de extensões).

Pontos relevantes:
- `content_scripts.matches`: restringe a execução a `*://*.instagram.com/*`
  — a extensão não roda em nenhum outro site.
- `run_at: "document_idle"`: espera o DOM inicial carregar antes de
  injetar os scripts, importante porque o Instagram é uma SPA React que
  monta a interface depois do carregamento inicial da página.
- `browser_specific_settings.gecko_android`: declara suporte explícito ao
  Firefox Android a partir da versão 113.
- `permissions`: só `storage` (preferências dos módulos) e `activeTab`.
  Nenhuma permissão de rede ou de acesso a outros sites.

**Pendências:** nenhuma — arquivo funcional e validado (JSON válido,
estrutura conferida).

---

## background.js

Script de fundo, roda uma vez quando a extensão é instalada/atualizada.

### `DEFAULT_PREFS` (objeto)
Define o estado inicial de cada módulo. Hoje:
- `scrollLimiter: true` — rolagem não infinita vem ativada por padrão.
- `scrollLimiterMinutes: 5` — minutos de rolagem liberados antes de
  pausar, configurável pelo slider no popup.
- `adRemover: false`, `followOnlyFilter: false`, `autoplayReset: false`,
  `notificationsReset: false` — os demais módulos começam desativados,
  e o usuário ativa cada um pelo popup.

**Decisão de produto pendente de validação com a equipe:** definir se
faz sentido algum outro módulo vir ativado por padrão, ou se todos devem
começar desligados e a extensão apenas oferecer as opções (postura mais
conservadora/menos intrusiva na primeira instalação).

### `browser.runtime.onInstalled` (listener)
Grava `DEFAULT_PREFS` no `storage.local` apenas na primeira instalação
(`details.reason === "install"`), preservando preferências já
customizadas em atualizações futuras.

### `browser.runtime.onMessage` (listener)
Responde à mensagem `GET_DEFAULT_PREFS`. Não é usado por nenhum outro
arquivo ainda — deixado como ponto de extensão caso seja útil no futuro
(ex.: um botão "restaurar padrões" no popup).

---

## content-scripts/config.js

Arquivo central de configuração. **Este é o arquivo mais importante do
projeto do ponto de vista de manutenção** — concentra todos os seletores
de DOM usados pela extensão, justamente porque o Instagram usa classes
CSS geradas automaticamente que mudam a cada deploy da plataforma.

### `REVERSA_CONFIG.feed`
- `mainSelector`: `'main[role="main"]'` — container principal do feed.
- `postSelector`: `"article"` — cada post individual.

### `REVERSA_CONFIG.feedSwitcher`
- `triggerSelector`: seletor do botão que abre o menu de alternância de
  feed (ícone de estrela). **Não validado contra o DOM real ainda.**
- `postOptionText`: texto usado para localizar a opção "Seguindo"
  dentro do menu, como estratégia de fallback mais robusta que depender
  só de classes CSS.

### `REVERSA_CONFIG.settings`
- `notificationsUrlFragment`, `autoplayUrlFragment`: trechos de URL que
  identificam as páginas de configuração relevantes. **Caminhos exatos
  não confirmados** — o Instagram reorganiza esse menu com frequência.
- `toggleSelector`: `'[role="switch"]'` — seletor genérico para os
  toggles de configuração (padrão de acessibilidade comum, mas precisa
  ser testado).

### `REVERSA_CONFIG.domPrefix`
Prefixo (`reversa-ext`) usado em todo elemento injetado pela extensão no
DOM da página, para evitar colisão com classes do próprio Instagram e
facilitar encontrar/remover esses elementos.

**Pendência crítica (prioridade #1 da equipe):** validar todos os
seletores acima contra o Instagram ao vivo, usando as devtools do
navegador. Nenhum módulo funciona de verdade até isso ser feito.

---

## content-scripts/scroll-limiter.js

Módulo 1 — rolagem não infinita. Exposto globalmente como
`window.ReversaScrollLimiter`, com interface pública `start()` / `stop()`.

**Modelo baseado em tempo** (não em quantidade de posts): a partir do
momento em que o módulo inicia (ou a rolagem é retomada), um
`setTimeout` conta os minutos configurados pelo usuário via slider no
popup. Ao esgotar o tempo, a rolagem é travada.

### Estado interno (fechado no escopo do IIFE)
`timerId`, `minutes`, `paused`.

### `createOverlay()`
Cria o elemento visual de pausa (card centralizado com mensagem
indicando quantos minutos já se passaram, e botão "Continuar
rolando"), injetado no `document.body`. O clique no botão chama
`resume()`.

### `scheduleTimer()`
Agenda (ou reagenda, cancelando o anterior) o disparo de
`pauseScroll()` para daqui a `minutes` minutos. Chamada tanto por
`start()` quanto por `resume()` — cada "Continuar rolando" reinicia a
contagem do zero.

### `pauseScroll()`
Trava a rolagem da página (`overflow: hidden` no `<html>`) e chama
`createOverlay()`. Não faz nada se já estiver pausado (`paused` guard).

### `resume()`
Reverte o travamento de scroll, remove o overlay do DOM e chama
`scheduleTimer()` para começar uma nova contagem de minutos.

### `start(configuredMinutes)`
Ponto de entrada do módulo. Define `minutes` (se um valor for passado)
e chama `scheduleTimer()`. Idempotente: não reagenda se já houver um
timer ativo, para não reiniciar a contagem toda vez que `applyPrefs()`
rodar de novo com o módulo já ligado.

### `stop()`
Cancela o temporizador ativo e libera a rolagem, garantindo que a
página não fique travada se o módulo for desativado no meio de uma
pausa.

**Pendências:** validar em teste real se o tempo configurado (padrão 5
min, slider de 1 a 15 min no popup) tem uma boa faixa de valores;
testar comportamento em telas menores (mobile).

---

## content-scripts/ad-remover.js

Módulo 2 — feed cronológico. Exposto como `window.ReversaAdRemover`.

**Decisão de arquitetura:** em vez de reordenar o DOM manualmente (caro e
frágil), o módulo automatiza o clique na opção nativa "Seguindo" que o
próprio Instagram já oferece — o Instagram volta ao feed algorítmico por
padrão a cada nova sessão, então a extensão repete esse clique.

### `findFollowingOption()`
Varre `div`, `span`, `a` da página procurando um elemento cujo texto
visível corresponda exatamente (case-insensitive) a "Seguindo" ou
"Following" (`REVERSA_CONFIG.feedSwitcher.postOptionText`).

### `trySwitchToFollowing()`
1. Clica no `trigger` (botão que abre o menu de alternância de feed).
2. Chama `findFollowingOption()` e clica no resultado, se encontrado.

### `start()`
Roda `trySwitchToFollowing()` a cada 3 segundos (`setInterval`) — a
repetição existe porque o menu só existe depois que a SPA termina de
montar, e pode precisar ser refeito em navegações internas sem reload de
página.

### `stop()`
Limpa o `setInterval`.

**Pendências:** confirmar se um clique único no trigger já abre o menu
com a opção visível, ou se há uma etapa intermediária (ex.: hover antes
do clique); confirmar se o clique na opção fecha o menu sozinho ou se é
preciso um clique adicional fora dele.

---

## content-scripts/follow-only-filter.js

Módulo 3 — mostrar apenas quem você segue. Exposto como
`window.ReversaFollowOnlyFilter`. Independente do módulo de feed
cronológico — pode ser ativado sozinho.

### `SUGGESTED_LABELS`
Lista de textos (`"Sugestão para você"`, `"Suggested for you"`) usados
como sinal de que um post é recomendado, não de uma conta seguida.

### `isSuggestedPost(postEl)`
Checa se o texto do post contém algum dos rótulos acima.

### `applyFilter(root)`
Percorre todos os posts dentro de `root` e esconde (`display: none`) os
identificados como sugeridos, marcando-os com
`dataset.reversaHidden = "true"` para poder reverter depois.

### `handleMutations(mutationsList)`
Callback do `MutationObserver`: para cada nó adicionado, chama
`applyFilter()` nele.

### `start()`
Aplica o filtro nos posts já presentes na página e começa a observar o
feed para novos posts. Mesmo padrão de espera de `scroll-limiter.js` se
o feed ainda não tiver carregado.

### `stop()`
Desconecta o observer e reverte a ocultação de todos os posts marcados
com `data-reversa-hidden="true"`.

**Limitação conhecida e documentada no próprio código:** o Instagram nem
sempre marca explicitamente no DOM que um post é sugerido. Quando o
rótulo não é encontrado, a extensão **mantém o post visível por
padrão** — decisão deliberada de errar para o lado de esconder de menos,
não de mais. Vale mencionar isso na demo como limitação transparente,
não escondida.

---

## content-scripts/settings-toggle-factory.js

Fábrica compartilhada pelos módulos 4a e 4b (`autoplay-reset.js` e
`notifications-reset.js`). Os dois módulos têm exatamente a mesma
lógica — "nesta página de configuração específica, desative todos os
toggles ativos" — mudando só qual página cada um observa. Em vez de
duplicar essa lógica em dois arquivos, este arquivo expõe
`createSettingsToggleModule(urlFragment)`, que devolve um módulo
independente (com seu próprio `start`/`stop` e seu próprio
`MutationObserver`) para o fragmento de URL passado.

### `createSettingsToggleModule(urlFragment)`
Recebe um trecho de URL (ex.:
`REVERSA_CONFIG.settings.autoplayUrlFragment`) e devolve um objeto
`{ start, stop }`. Internamente:
- `isRelevantSettingsPage()`: checa se `location.pathname` contém o
  `urlFragment` recebido.
- `disableActiveToggles()`: se a página for relevante, percorre todos
  os elementos `[role="switch"]` e clica nos que estiverem com
  `aria-checked="true"` (ativados), desativando-os.
- `start()`: roda `disableActiveToggles()` imediatamente e observa
  mudanças no `document.body` inteiro (não só no feed) — necessário
  porque as páginas de configuração também são SPA.
- `stop()`: desconecta o observer. Não reverte toggles já desativados
  (decisão deliberada — desligar o módulo não deveria reativar algo
  que o usuário já tinha desligado).

Cada chamada a `createSettingsToggleModule()` cria um observer
independente — dois módulos criados por ela podem rodar ao mesmo
tempo sem interferir um no outro.

---

## content-scripts/autoplay-reset.js

Módulo 4a — reversão de autoplay. Exposto como
`window.ReversaAutoplayReset`. Criado com uma linha, chamando
`createSettingsToggleModule(REVERSA_CONFIG.settings.autoplayUrlFragment)`.
Independente do módulo de notificações — pode ser ativado sozinho.

**Pendência:** confirmar o caminho exato da página de autoplay do
Instagram (`REVERSA_CONFIG.settings.autoplayUrlFragment`) — o
Instagram reorganiza esse menu com frequência.

---

## content-scripts/notifications-reset.js

Módulo 4b — reversão de notificações. Exposto como
`window.ReversaNotificationsReset`. Criado da mesma forma que o
módulo 4a, com
`createSettingsToggleModule(REVERSA_CONFIG.settings.notificationsUrlFragment)`.
Independente do módulo de autoplay — pode ser ativado sozinho.

**Decisão de produto pendente:** o Instagram tem múltiplas categorias
de notificação (curtidas, comentários, novos seguidores, mensagens
etc.) possivelmente na mesma página. Hoje o código desativa **todos**
os toggles ativos ali — a equipe precisa decidir se esse é o
comportamento desejado ou se deveria haver granularidade (ex.: manter
notificações de mensagens diretas ativadas).

---

## content-scripts/index.js

Orquestrador. Único arquivo que lê o `browser.storage` e decide quais
módulos ficam ativos — nenhum módulo se autoativa.

### `applyPrefs(prefs)`
Para cada um dos 5 módulos, chama `.start()` ou `.stop()` conforme o
respectivo booleano em `prefs`. Módulos são completamente independentes
entre si — qualquer combinação é válida.

### `init()`
Lê `prefs` do `storage.local` na carga da página e aplica.

### `browser.storage.onChanged` (listener)
Reage a mudanças de preferência feitas pelo popup **em tempo real**, sem
precisar recarregar a página do Instagram.

**Sem pendências conhecidas** — a lógica de orquestração em si é simples
e não depende de seletores do Instagram (só de storage), então é a parte
mais estável do projeto.

---

## content-scripts/overlay.css

Estilo do overlay do módulo de rolagem (`scroll-limiter.js`). Usa
`position: fixed; inset: 0` para cobrir a tela inteira, com um card
centralizado. Cores usam um tom de roxo (`#581c87`) como identidade
visual provisória.

**Pendência:** alinhar com identidade visual final do projeto, se
diferente desse roxo provisório.

---

## popup/

### popup.html
Estrutura do popup: cabeçalho com nome do projeto, 5 controles (um por
módulo, com `id` correspondente às chaves usadas em `prefs`), rodapé
com crédito "Todas Labs". O controle de rolagem não infinita tem, além
do checkbox de ligar/desligar, um slider (`input[type="range"]`, 1 a 15
minutos) para configurar a duração antes de pausar.

### popup.js
- `TOGGLE_IDS`: lista dos 4 ids de checkbox booleanos (não inclui o
  slider de minutos, tratado à parte), usada tanto para carregar quanto
  para salvar preferências, evitando repetição de código.
- `setSliderEnabled(enabled)`: habilita/desabilita visualmente o slider
  de minutos conforme o checkbox de rolagem está ligado ou desligado.
- `loadPrefs()`: lê `storage.local.prefs`, marca cada checkbox conforme
  o valor salvo e ajusta o slider (valor e estado habilitado/desabilitado).
- `savePref(id, value)`: mescla a mudança no objeto `prefs` existente e
  regrava no storage — importante usar merge (`{ ...prefs, [id]: value }`)
  em vez de sobrescrever tudo, para não perder preferências de outros
  módulos.
- Um listener de `change` por checkbox, chamando `savePref`.
- O slider tem dois listeners: `input` (atualiza o rótulo em tempo real
  enquanto o usuário arrasta, sem gravar no storage a cada pixel) e
  `change` (grava o valor final quando o usuário solta o slider).

### popup.css
Estilo simples: cabeçalho roxo (mesma cor do overlay), lista de toggles
com borda inferior separando cada linha, e uma classe `.disabled` que
esmaece visualmente o slider quando o módulo de rolagem está desligado.

**Sem pendências conhecidas** — popup é funcional e não depende de
seletores do Instagram.

---

## icons/

Quatro tamanhos (16, 32, 48, 128px), gerados como placeholder: círculo
roxo com duas barras brancas (remete a "pausa"). **Precisam ser
substituídos pela identidade visual final do projeto** antes de qualquer
submissão pública ou publicação na AMO.

---

## Resumo de pendências por prioridade

1. **Validar todos os seletores em `config.js`** contra o Instagram real
   — bloqueia o funcionamento de todos os 5 módulos.
2. Testar `ad-remover.js` (fluxo de clique no menu de alternância).
3. Decidir escopo de `notifications-reset.js` (desativar tudo vs.
   granularidade por categoria de notificação).
4. Decidir se `follow-only-filter.js` precisa de heurística adicional
   além do texto "Sugestão para você", dado que esse rótulo pode não
   cobrir todos os casos de conteúdo recomendado.
5. Substituir ícones placeholder pela identidade visual final.
