require('dotenv').config();
const app  = require('./src/app');
const path = require('path');
const fs   = require('fs');

// Auto-init de la base de données au premier démarrage
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database/skillmap.db');
if (!fs.existsSync(dbPath)) {
  console.log('[init] Première exécution : initialisation de la base de données…');
  require('./database/init')();
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n[start] SkillMap API démarrée sur http://localhost:${PORT}`);
  console.log(`[frontend] Servi sur http://localhost:${PORT}`);
  console.log(`[accounts] Comptes de test :`);
  console.log(`   Client  : marie@test.ci / password123`);
  console.log(`   Presta  : kone@test.ci  / password123`);
  console.log(`   Admin   : admin@skillmap.ci / password123`);
});
