# Intranet Re-Teck

Portal interno da Re-Teck para **documentação por departamento**, com controle de
versões e validade de documentos (estilo ISO 9001), avisos, conteúdo institucional
e painel administrativo. Acesso por **login**, com visibilidade restrita por setor.

---

## ✨ Principais funcionalidades

- **Documentos no banco (SQLite):** os arquivos vivem dentro do SQLite (content-addressed
  por `sha256`, com dedup transparente). Cada documento tem **versões** (upload, histórico,
  rollback) e **controle ISO**: status (rascunho → em revisão → aprovado → obsoleto),
  data de vigência e de revisão.
- **Acesso por setor:** o site inteiro exige login. Cada **usuário** vê apenas os documentos
  dos **setores** vinculados a ele; **Admin/Owner** veem tudo.
- **Papéis:** `owner` (Fabrício), `admin` e `user`. Admin/Owner gerenciam usuários e conteúdo.
- **Validade das ISOs:** cadastro de certificações com status por data e checagem periódica
  da disponibilidade do link.
- **Auditoria:** trilha de quem fez o quê (uploads, aprovações, exclusões, downloads…).
- **Conteúdo da Home:** editor visual (sem HTML) e tabelas de Contatos/Ramais.
- **Busca global** (no topo) e seção **"Atualizados recentemente"**, ambas respeitando o setor.
- **Segurança:** JWT com segredo forte, rate-limit no login e auto-logout ao expirar.
- **Backup automático** diário do banco (com retenção).

## 🧱 Stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind + shadcn/ui, TanStack Query, TipTap (editor).
- **Backend:** Node + Express 5 (arquivos `.cjs`), **better-sqlite3** (SQLite), JWT, bcrypt, multer.
- **Processo:** PM2 (o backend serve a API **e** o SPA buildado, na porta **3001**).

## 📁 Estrutura

```
server/                 Backend Express (CommonJS .cjs)
  index.cjs             Entry point (porta 3001) — monta rotas e serve o /dist
  database.cjs          Schema + migrações + seed
  middleware/auth.cjs   JWT (requireAuth / requireAdmin / requireOwner)
  routes/               admins, departments, documents, iso, audit, announcements, homeContent
  services/             blobStore, auditLog, isoMonitor, backup, access
  scripts/              migrate-files-to-db.cjs  (migração dos arquivos do disco → SQLite)
src/                    Frontend React
  pages/ , pages/admin/ Páginas públicas e do painel
  components/           Header, GlobalSearch, ProtectedRoute, admin/*
  lib/                  api, download, deptEmoji, homeTables, ...
ecosystem.config.cjs    Configuração do PM2
```

## 🚀 Desenvolvimento

```bash
npm install
npm run server      # backend Express (porta 3001) com nodemon
npm run dev         # frontend Vite (porta 8080, faz proxy de /api e /docs → 3001)
```

Acesse `http://localhost:8080`.

## 📦 Build de produção

```bash
npm run build       # gera /dist; o backend passa a servir o SPA na porta 3001
```

## 🔧 Deploy com PM2

```bash
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save            # persiste a lista de processos (resurrect no boot)
```

Comandos úteis: `pm2 logs intranet-reteck`, `pm2 restart intranet-reteck`, `pm2 status`.

## 🔐 Configuração e segurança

- **`JWT_SECRET`**: lido de `process.env.JWT_SECRET`; se ausente, é **gerado** e persistido em
  `server/jwt-secret.txt` (fora do git). Trocar o segredo desconecta todos uma vez.
- **Owner padrão** (base vazia): `rtbrti03@re-teckbr.com` / senha `Brasil!23` — **troque após o 1º acesso**.
- Usuários comuns são criados pelo painel **Usuários**, com os setores marcados.

## 🗄️ Banco de dados e backup

- O banco fica em `server/intranet.db` e **não é versionado** (contém dados e os arquivos).
- Backups automáticos diários em `server/backups/` (retenção de 14). Para restaurar, pare o
  PM2 e substitua `server/intranet.db` por um arquivo de `server/backups/`.

## 📥 Migração dos arquivos do disco para o banco

Para importar os arquivos que hoje estão na pasta `C:\Intranet\Documentos` (referenciados em
`documents.file_path`) como **versão 1** de cada documento:

```bash
node server/scripts/migrate-files-to-db.cjs --dry-run   # relatório, não grava nada
node server/scripts/migrate-files-to-db.cjs             # importa de fato
```

É idempotente (documentos que já têm versão são ignorados) e reporta os arquivos não encontrados.

## 🔄 Atualizar no servidor (git pull)

> Como o banco deixou de ser versionado, **preserve `server/intranet.db`** ao atualizar:

```bash
pm2 stop intranet-reteck
move server\intranet.db server\intranet.db.keep   # tira o banco do caminho do pull
git pull
move server\intranet.db.keep server\intranet.db   # devolve o banco (agora ignorado pelo git)
npm install
npm run build
pm2 restart intranet-reteck
```
