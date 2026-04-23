const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
    'null', // pour les fichiers HTML ouverts directement depuis le disque
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sert les fichiers statiques — racine du projet (là où sont les HTML)
app.use(express.static(path.join(__dirname, '../..')));

// ─── Routes API ──────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/providers',  require('./routes/providers'));
app.use('/api/services',   require('./routes/services'));
app.use('/api/favorites',  require('./routes/favorites'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/appointments',  require('./routes/appointments'));
app.use('/api/wallet',        require('./routes/wallet'));
app.use('/api/admin',         require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Toutes les autres routes servent le frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../skillmap.html'));
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

module.exports = app;
