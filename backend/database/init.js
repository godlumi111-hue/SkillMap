const { DatabaseSync } = require('node:sqlite');
const fs   = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'skillmap.db');
const SCHEMA  = path.join(__dirname, 'schema.sql');
const SEED    = path.join(__dirname, 'seed.sql');

function initDatabase(existingDb) {
  const db = existingDb || new DatabaseSync(DB_PATH);

  if (!existingDb) {
    db.exec('PRAGMA foreign_keys = ON');
    db.exec('PRAGMA journal_mode = WAL');
  }

  const schema = fs.readFileSync(SCHEMA, 'utf8');
  db.exec(schema);
  console.log('[ok] Schéma appliqué');

  if (process.env.NODE_ENV !== 'production') {
    const seed = fs.readFileSync(SEED, 'utf8');
    db.exec(seed);
    console.log('[ok] Données de test insérées');
  }

  if (!existingDb) db.close();
  console.log('[ok] Base de données initialisée :', DB_PATH);
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  initDatabase();
}

module.exports = initDatabase;
