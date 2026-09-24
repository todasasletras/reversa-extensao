# Reversa — extensão Firefox para configurações padrão a favor do usuário

Extensão de código aberto para Mozilla Firefox (desktop e Android) que
reverte configurações padrão viciantes do Instagram: rolagem infinita,
feed algorítmico e autoplay/notificações. Desenvolvida do zero pela Todas
Labs para o Hackathon do Festival Compartilhe, como demonstração prática
das obrigações previstas no PL 4675/2025.

## Status

Esqueleto funcional inicial. Os seletores de DOM em
`content-scripts/config.js` são um ponto de partida e **precisam ser
validados contra o Instagram real** antes de qualquer demo — o Instagram
muda a interface com frequência, e os seletores aqui foram escritos sem
acesso ao DOM ao vivo no momento da criação deste esqueleto.

## Arquitetura

```
extensao-privacidade/
├── manifest.json              # Manifest V2, compatível com Firefox Android
├── background.js              # inicializa preferências padrão no storage
├── content-scripts/
│   ├── config.js                    # TODOS os seletores DOM, centralizados aqui
│   ├── scroll-limiter.js             # Módulo 1: rolagem não infinita (baseado em tempo)
│   ├── chrono-feed.js                # Módulo 2: feed cronológico
│   ├── follow-only-filter.js         # Módulo 3: só quem você segue
│   ├── settings-toggle-factory.js    # fábrica compartilhada pelos módulos 4a/4b
│   ├── autoplay-reset.js             # Módulo 4a: autoplay
│   ├── notifications-reset.js        # Módulo 4b: notificações
│   ├── overlay.css                   # estilo do overlay de pausa de rolagem
│   └── index.js                      # orquestrador: liga/desliga módulos por preferência
├── popup/
│   ├── popup.html               # UI com 5 controles (4 toggles + slider de minutos)
│   ├── popup.js                 # sincroniza toggles com storage
│   └── popup.css
└── icons/                       # ícones placeholder (substituir por identidade final)
```

### Princípio de design: módulos independentes

Cada módulo (`ReversaScrollLimiter`, `ReversaChronoFeed`,
`ReversaFollowOnlyFilter`, `ReversaAutoplayReset`,
`ReversaNotificationsReset`) expõe uma interface pública mínima
(`start()` / `stop()`) — os dois últimos são criados por uma fábrica
compartilhada (`settings-toggle-factory.js`), já que têm exatamente a
mesma lógica interna, mudando só qual página do Instagram cada um
observa. O arquivo `index.js` é o único lugar que decide, com base no
`browser.storage`, quais módulos devem estar ativos — isso segue o
critério de **customização** da proposta: qualquer combinação de
módulos pode estar
ligada ao mesmo tempo, sem que um dependa do outro.

### Por que `config.js` é separado

O maior risco técnico do projeto é a instabilidade dos seletores CSS do
Instagram (classes geradas automaticamente, que mudam a cada deploy).
Centralizar todos os seletores em um único arquivo significa que, se algo
quebrar durante o desenvolvimento ou na demo, o ajuste é rápido e
localizado — não é preciso caçar seletores espalhados pelo código.

## Como rodar localmente

1. Instale a ferramenta oficial da Mozilla:
   ```
   npm install --global web-ext
   ```
2. Dentro da pasta do projeto:
   ```
   web-ext run
   ```
   Isso abre um Firefox temporário com a extensão já carregada, e recarrega
   automaticamente a cada mudança de arquivo.

## Como testar no Firefox para Android

1. Ative o modo desenvolvedor no Firefox Nightly para Android
   (Configurações → About Firefox Nightly → toque 5x na versão).
2. Conecte o celular ao computador via USB com depuração habilitada.
3. No Firefox desktop, acesse `about:debugging` → aba do dispositivo
   Android conectado → "Load Temporary Add-on" apontando para a pasta do
   projeto.

## Próximos passos (roadmap da hackathon)

- [ ] **Validar seletores reais** em `content-scripts/config.js` inspecionando
      o Instagram ao vivo (prioridade #1 antes de qualquer outro ajuste).
- [ ] Testar `chrono-feed.js` e `follow-only-filter.js` juntos e separados,
      confirmando que funcionam de forma independente como propõe a
      proposta.
- [ ] Revisar `autoplay-reset.js` e `notifications-reset.js` com as rotas
      reais de configurações do Instagram (notificações têm múltiplas
      subcategorias — decidir escopo).
- [ ] Ajustar `scrollLimiterMinutes` (padrão 5 min, slider de 1 a 15) com
      base em teste de usuário informal da própria equipe.
- [ ] Substituir os ícones placeholder em `icons/` pela identidade visual
      final do projeto.
- [ ] Escrever `privacy_policy` simples para publicação na AMO (mesmo sem
      coleta de dados, a loja pede declaração explícita).
- [ ] Publicar como "Unlisted" na AMO para poder instalar via link direto
      durante os testes em dispositivo real, antes da demo final.

## Licença

Sugestão: GPL-3.0, mesma licença já usada em outros projetos de código
aberto da Todas Labs (ex. extensão de detecção de dark patterns).
