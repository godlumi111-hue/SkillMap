// Utilise le module SQLite intégré à Node.js 22+ (node:sqlite)
// Aucune dépendance externe ni compilation C++ requise
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/skillmap.db');

let _db = null;

function getDb() {
  if (_db) return _db;

  const isNew = !fs.existsSync(DB_PATH);

  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA foreign_keys = ON');
  _db.exec('PRAGMA journal_mode = WAL');

  // Toujours appliquer le schéma (CREATE TABLE IF NOT EXISTS est idempotent)
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    _db.exec(fs.readFileSync(schemaPath, 'utf8'));
  }

  // Insérer les données de test uniquement sur une DB fraîche
  if (isNew) {
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      _db.exec(fs.readFileSync(seedPath, 'utf8'));
      console.log('✅ Données de test insérées');
    }
  }

  return _db;
}

module.exports = { getDb };
