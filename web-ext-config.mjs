// Configuração do web-ext (carregada automaticamente por `web-ext run/lint/build`).
export default {
  // O perfil de desenvolvimento do Firefox fica dentro da pasta do projeto;
  // sem isso o web-ext observa as escritas do Firefox no perfil e recarrega
  // a extensão em loop, além de empacotá-lo no build.
  ignoreFiles: ["perfil-dev", "perfil-dev/**", "web-ext-config.mjs", "DOCUMENTACAO.md"],
};
