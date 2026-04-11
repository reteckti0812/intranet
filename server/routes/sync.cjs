const fs = require('fs');
const path = require('path');
const db = require('../database.cjs');

const ROOT_DOCS_PATH = 'C:\\Intranet\\Documentos';

function syncFoldersToDatabase() {
  console.log('--- Iniciando Sincronização de Pastas ---');
  const startTime = Date.now();

  if (!fs.existsSync(ROOT_DOCS_PATH)) {
    throw new Error(`Caminho raiz não encontrado: ${ROOT_DOCS_PATH}`);
  }

  // Lê apenas pastas dentro do diretório raiz
  const deptFolders = fs.readdirSync(ROOT_DOCS_PATH).filter(f => {
    return fs.statSync(path.join(ROOT_DOCS_PATH, f)).isDirectory();
  });

  // Limpa documentos antes de sincronizar para evitar duplicatas
  db.prepare('DELETE FROM documents').run();

  const syncTransaction = db.transaction(() => {
    for (const folderName of deptFolders) {

      // Regex: separa código numérico do nome (ex: "12RecursosHumanos" → "12" e "RecursosHumanos")
      const match = folderName.match(/^(\d+)(.+)$/);
      if (!match) {
        console.log(`⚠️  Pasta ignorada (fora do padrão): ${folderName}`);
        continue;
      }

      const code = match[1];
      const rawName = match[2];

      // Gera slug: remove acentos, espaços e caracteres especiais
      const slug = rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const deptPath = path.join(ROOT_DOCS_PATH, folderName);

      // Upsert Departamento
      db.prepare(`
        INSERT INTO departments (code, name, slug, folder_path)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          folder_path = excluded.folder_path
      `).run(code, rawName, slug, deptPath);

      const dept = db.prepare('SELECT id FROM departments WHERE code = ?').get(code);

      // Lê subpastas (grupos) dentro do departamento
      const groupFolders = fs.readdirSync(deptPath).filter(f => {
        return fs.statSync(path.join(deptPath, f)).isDirectory();
      });

      for (const groupName of groupFolders) {
        const groupPath = path.join(deptPath, groupName);

        // Upsert Grupo
        db.prepare(`
          INSERT INTO groups (department_id, name, folder_path)
          VALUES (?, ?, ?)
          ON CONFLICT(department_id, name) DO UPDATE SET
            folder_path = excluded.folder_path
        `).run(dept.id, groupName, groupPath);

        const group = db.prepare(
          'SELECT id FROM groups WHERE department_id = ? AND name = ?'
        ).get(dept.id, groupName);

        // Lê arquivos dentro do grupo
        const files = fs.readdirSync(groupPath).filter(f => {
          return fs.statSync(path.join(groupPath, f)).isFile();
        });

        for (const fileName of files) {
          const filePath = path.join(groupPath, fileName);
          const ext = path.extname(fileName).toLowerCase();

          // Regex: separa código e título (ex: "RT-12-001 - Férias.pdf" → "RT-12-001" e "Férias")
          const fileMatch = fileName.match(/^(.+?)\s-\s(.+?)(\.[^.]+)$/);

          let fileCode = '';
          let fileTitle = fileName.replace(ext, ''); // fallback: nome sem extensão

          if (fileMatch) {
            fileCode = fileMatch[1].trim();
            fileTitle = fileMatch[2].trim();
          }

          db.prepare(`
            INSERT INTO documents (group_id, code, title, file_name, file_path, file_extension)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(group.id, fileCode, fileTitle, fileName, filePath, ext);
        }

        console.log(`  📂 ${folderName}/${groupName}: ${files.length} arquivo(s) sincronizado(s)`);
      }

      console.log(`✅ Departamento sincronizado: [${code}] ${rawName}`);
    }
  });

  syncTransaction();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Sincronização concluída em ${duration}s!`);
}

module.exports = { syncFoldersToDatabase };