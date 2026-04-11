const express = require('express');
const router = express.Router();
const db = require('../database.cjs');
const { syncFoldersToDatabase, syncDatabaseToDocumentos } = require('../services/syncService.cjs');

function parseStatsRow(row) {
  if (!row?.content) return null;
  try {
    return JSON.parse(row.content);
  } catch (_) {
    return null;
  }
}

function getMeta(key) {
  return db.prepare(`SELECT content FROM home_content WHERE key = ?`).get(key);
}

router.get('/status', (req, res) => {
  try {
    const intranetAt = getMeta('last_sync_intranet_at');
    const intranetStats = parseStatsRow(getMeta('last_sync_intranet_stats'));
    const documentsAt = getMeta('last_sync_documents_at');
    const documentsStats = parseStatsRow(getMeta('last_sync_documents_stats'));

    const legacyAt = getMeta('last_sync_at');
    const legacyStats = parseStatsRow(getMeta('last_sync_stats'));

    res.json({
      intranet: {
        lastSyncAt: intranetAt?.content ?? legacyAt?.content ?? null,
        lastStats: intranetStats ?? legacyStats ?? null,
      },
      documents: {
        lastSyncAt: documentsAt?.content ?? null,
        lastStats: documentsStats ?? null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erro ao ler estado da sincronização.' });
  }
});

/** Lê a pasta Documentos e atualiza a base (site / intranet) */
function respondPastaParaSite(res) {
  const result = syncFoldersToDatabase();
  res.json({
    success: true,
    message: 'Intranet atualizada a partir da pasta Documentos.',
    direction: 'documentos-para-intranet',
    data: result,
  });
}

/** Alinha a pasta Documentos com a base de dados */
function respondBdParaPasta(res) {
  const result = syncDatabaseToDocumentos();
  res.json({
    success: true,
    message: 'Pasta Documentos alinhada com a base de dados.',
    direction: 'intranet-para-documentos',
    data: result,
  });
}

// Endpoints explícitos (preferidos pelo front)
router.post('/pasta-para-site', (req, res) => {
  try {
    respondPastaParaSite(res);
  } catch (error) {
    console.error('Erro em pasta-para-site:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar o site a partir das pastas.',
    });
  }
});

router.post('/bd-para-pasta', (req, res) => {
  try {
    respondBdParaPasta(res);
  } catch (error) {
    console.error('Erro em bd-para-pasta:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao alinhar a pasta Documentos com a base.',
    });
  }
});

// Aliases antigos (mesmo comportamento que os endpoints explícitos)
router.post('/intranet', (req, res) => {
  try {
    respondPastaParaSite(res);
  } catch (error) {
    console.error('Erro na sincronização (/intranet):', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao sincronizar para a intranet.',
    });
  }
});

router.post('/documentos', (req, res) => {
  try {
    respondBdParaPasta(res);
  } catch (error) {
    console.error('Erro na sincronização (/documentos):', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao sincronizar a pasta Documentos.',
    });
  }
});

/** @deprecated use POST /pasta-para-site */
router.post('/', (req, res) => {
  try {
    respondPastaParaSite(res);
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao sincronizar arquivos.',
    });
  }
});

module.exports = router;
