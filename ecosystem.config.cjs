// Configuração do PM2 para a Intranet Re-Teck.
// O backend (Express) serve a API e também o SPA já buildado em /dist na porta 3001.
//
// Uso:
//   npm run build                       (gera o /dist antes de subir)
//   pm2 start ecosystem.config.cjs      (sobe)
//   pm2 save                            (persiste a lista de processos)
//   pm2 logs intranet-reteck            (acompanha os logs)
//   pm2 restart intranet-reteck         (reinicia após mudanças)
module.exports = {
  apps: [
    {
      name: 'intranet-reteck',
      script: 'server/index.cjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork', // instância única: better-sqlite3 + WAL
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        // Defina um segredo forte aqui (ou via variável de ambiente do sistema)
        // para substituir o fallback do código. Mudar isto desloga os admins atuais.
        // JWT_SECRET: 'troque-por-um-segredo-forte',
      },
    },
  ],
};
