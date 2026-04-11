const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database.cjs');
const { syncFoldersToDatabase } = require('./routes/sync.cjs');
const departmentRoutes = require('./routes/departments.cjs');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/ping', (req, res) => {
  res.json({ message: '🚀 Backend Re-Teck Online!', time: new Date() });
});

// Rota de Sincronização
app.post('/api/sync', (req, res) => {
  try {
    syncFoldersToDatabase();
    res.json({ success: true, message: 'Sincronização realizada com sucesso!' });
  } catch (error) {
    console.error('ERRO DETALHADO:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/api/departments', departmentRoutes);

// Servir arquivos estáticos (PDFs, DOCXs, etc.)
app.use('/docs', express.static('C:\\Intranet\\Documentos'));

// Inicialização
app.listen(PORT, () => {
  console.log(`
  🚀 Servidor Intranet Re-Teck rodando!
  📡 API:        http://localhost:${PORT}/api
  📁 Documentos: http://localhost:${PORT}/docs
  `);
});