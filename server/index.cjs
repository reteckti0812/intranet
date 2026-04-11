const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const db = require('./database.cjs');
const syncRoutes = require('./routes/sync.cjs');
const departmentRoutes = require('./routes/departments.cjs');
const homeContentRoutes = require('./routes/homeContent.cjs');
const adminRoutes = require('./routes/admins.cjs');
const announcementRoutes = require('./routes/announcements.cjs');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/home-content', homeContentRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/sync', syncRoutes); // ✅ Sintaxe corrigida (estava com vírgula errada)

// Rota de teste
app.get('/api/ping', (req, res) => {
  res.json({ message: '🚀 Backend Re-Teck Online!', time: new Date() });
});

// Abrir pasta no Explorer
app.get('/api/open-folder', (req, res) => {
  const folderPath = 'C:\\Intranet\\Documentos';
  exec(`explorer "${folderPath}"`, (err) => {
    if (err) return res.status(500).json({ error: "Não foi possível abrir a pasta" });
    res.json({ success: true });
  });
});

// Servir arquivos estáticos (PDFs, DOCXs, etc.)
app.use('/docs', express.static('C:\\Intranet\\Documentos'));

// Build do Vite: um único host (ex.: http://localhost:3001) com SPA + API — evita 404 em /departamentos/... sem index.html
const distPath = path.join(__dirname, '..', 'dist');
const distIndex = path.join(distPath, 'index.html');
if (fs.existsSync(distIndex)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/docs')) return next();
    res.sendFile(distIndex, (err) => (err ? next(err) : undefined));
  });
}

// Inicialização
app.listen(PORT, () => {
  const uiLine = fs.existsSync(distIndex)
    ? `\n  🖥️  Interface:  http://localhost:${PORT}/  (build em /dist)`
    : '';
  console.log(`
  🚀 Servidor Intranet Re-Teck rodando!
  📡 API:        http://localhost:${PORT}/api
  📁 Documentos: http://localhost:${PORT}/docs${uiLine}
  `);
});