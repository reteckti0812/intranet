/**
 * Migração única: importa os arquivos que hoje estão no disco
 * (documents.file_path) para dentro do SQLite como a versão 1 de cada
 * documento. Documentos já migrados (que já têm versão) são ignorados.
 *
 * Uso:
 *   node server/scripts/migrate-files-to-db.cjs            (executa)
 *   node server/scripts/migrate-files-to-db.cjs --dry-run  (só relatório)
 *
 * É idempotente: rodar de novo não duplica versões.
 */
const fs = require('fs');
const path = require('path');
const db = require('../database.cjs');
const blob = require('../services/blobStore.cjs');

const DRY_RUN = process.argv.includes('--dry-run');

const EXT_MIME = {
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const extOf = (name) => String(name || '').split('.').pop().toLowerCase();

function run() {
  const docs = db
    .prepare(`SELECT id, title, file_path, file_type, current_version_id FROM documents WHERE is_deleted = 0`)
    .all();

  const stats = { total: docs.length, imported: 0, skipped: 0, missing: 0, errors: 0 };
  const problems = [];

  const insertVersion = db.prepare(`
    INSERT INTO document_versions
      (document_id, version_number, blob_sha256, file_name, file_type, size, change_note, created_by_name)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?)
  `);
  const setCurrent = db.prepare(`UPDATE documents SET current_version_id = ?, file_type = ? WHERE id = ?`);

  for (const doc of docs) {
    if (doc.current_version_id) {
      stats.skipped += 1;
      continue;
    }
    if (!doc.file_path) {
      stats.missing += 1;
      problems.push(`#${doc.id} "${doc.title}": sem file_path.`);
      continue;
    }
    if (!fs.existsSync(doc.file_path)) {
      stats.missing += 1;
      problems.push(`#${doc.id} "${doc.title}": arquivo não encontrado em ${doc.file_path}`);
      continue;
    }

    try {
      const buf = fs.readFileSync(doc.file_path);
      const fileName = path.basename(doc.file_path);
      const ext = doc.file_type || extOf(fileName);
      const mimeType = EXT_MIME[ext] || 'application/octet-stream';

      if (DRY_RUN) {
        stats.imported += 1;
        continue;
      }

      const tx = db.transaction(() => {
        const hash = blob.storeBytes(buf, mimeType);
        blob.retain(hash);
        const info = insertVersion.run(doc.id, hash, fileName, ext, buf.length, 'Versão inicial (migração)', 'Migração');
        setCurrent.run(info.lastInsertRowid, ext, doc.id);
      });
      tx();
      stats.imported += 1;
    } catch (e) {
      stats.errors += 1;
      problems.push(`#${doc.id} "${doc.title}": ${e.message}`);
    }
  }

  console.log('\n===== Migração de arquivos → SQLite =====');
  console.log(DRY_RUN ? '(modo --dry-run, nada foi gravado)\n' : '');
  console.log(`Documentos analisados : ${stats.total}`);
  console.log(`Importados            : ${stats.imported}`);
  console.log(`Já tinham versão      : ${stats.skipped}`);
  console.log(`Sem arquivo no disco  : ${stats.missing}`);
  console.log(`Erros                 : ${stats.errors}`);
  if (problems.length) {
    console.log('\nPendências:');
    for (const p of problems) console.log('  - ' + p);
  }
  console.log('\nConcluído.\n');
}

run();
