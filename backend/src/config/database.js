// Utilise le module SQLite intégré à Node.js 22+ (node:sqlite)
// Aucune dépendance externe ni compilation C++ requise
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/skillmap.db');

let _db = null;

function getDb() {
  if (_db) return _db;

  const needsInit = !fs.existsSync(DB_PATH);

  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA foreign_keys = ON');
  _db.exec('PRAGMA journal_mode = WAL');

  if (needsInit) {
    const initDatabase = require('../../database/init');
    initDatabase(_db);
  }

  return _db;
}

module.exports = { getDb };
