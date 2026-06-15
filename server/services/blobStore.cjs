const crypto = require('crypto');
const db = require('../database.cjs');

/**
 * Armazenamento de bytes endereçado por conteúdo (content-addressed).
 * Cada conteúdo único é guardado uma só vez, identificado pelo sha256.
 * Várias versões podem apontar para o mesmo blob (refcount). Tudo isto é
 * invisível para o admin — ele só sobe e baixa arquivos.
 */

const insertBlob = db.prepare(`
  INSERT INTO document_blobs (sha256, bytes, size, mime_type, refcount)
  VALUES (?, ?, ?, ?, 0)
  ON CONFLICT(sha256) DO NOTHING
`);
const selBytes = db.prepare(`SELECT bytes, size, mime_type FROM document_blobs WHERE sha256 = ?`);
const incRef = db.prepare(`UPDATE document_blobs SET refcount = refcount + 1 WHERE sha256 = ?`);
const decRef = db.prepare(`UPDATE document_blobs SET refcount = MAX(refcount - 1, 0) WHERE sha256 = ?`);
const delIfUnused = db.prepare(`DELETE FROM document_blobs WHERE sha256 = ? AND refcount <= 0`);

function hashBuffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Grava os bytes (idempotente por hash) e devolve o sha256. Não mexe no refcount. */
function storeBytes(buf, mimeType) {
  const hash = hashBuffer(buf);
  insertBlob.run(hash, buf, buf.length, mimeType || null);
  return hash;
}

/** Liga mais uma referência ao blob. */
function retain(hash) {
  if (hash) incRef.run(hash);
}

/** Solta uma referência; apaga fisicamente o blob se ninguém mais o usa. */
function release(hash) {
  if (!hash) return;
  decRef.run(hash);
  delIfUnused.run(hash);
}

/** Lê os bytes de um blob. Retorna { bytes: Buffer, size, mime_type } ou undefined. */
function readBytes(hash) {
  return selBytes.get(hash);
}

module.exports = { hashBuffer, storeBytes, retain, release, readBytes };
