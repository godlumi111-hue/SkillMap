# SkillMap — Application Full-Stack

Plateforme de mise en relation entre clients et prestataires locaux à Abidjan.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | HTML/CSS/JS Vanilla (vos fichiers existants) |
| Backend | Node.js + Express.js |
| Base de données | SQLite via `node:sqlite` (intégré Node.js 22+) |
| Auth | JWT + bcrypt |
| Géolocalisation | Formule de Haversine |

---

## Lancement en 3 étapes

### 1. Prérequis
- Node.js **v22+** (vous avez v24 ✓)
- npm

### 2. Installation

```bash
cd backend
npm install
```

### 3. Démarrer le serveur

```bash
cd backend
npm start
```

Puis ouvrir **http://localhost:3001** dans le navigateur.

Le serveur sert automatiquement les fichiers HTML du dossier `frontend/`.

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Client | marie@test.ci | password123 |
| Client | jean@test.ci | password123 |
| Prestataire | kone@test.ci | password123 |
| Prestataire | aicha@test.ci | password123 |
| Admin | admin@skillmap.ci | password123 |

---

## Structure du projet

```
Front_SkillMap/
│
├── backend/                   ← Serveur Node.js
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    ← Connexion SQLite (node:sqlite)
│   │   ├── middleware/
│   │   │   └── auth.js        ← JWT middleware
│   │   ├── routes/            ← Définition des routes Express
│   │   │   ├── auth.js
│   │   │   ├── providers.js
│   │   │   ├── services.js
│   │   │   ├── favorites.js
│   │   │   ├── categories.js
│   │   │   ├── messages.js
│   │   │   └── admin.js
│   │   └── controllers/       ← Logique métier
│   │       ├── authController.js
│   │       ├── providerController.js
│   │       ├── reviewController.js
│   │       ├── serviceController.js
│   │       ├── favoriteController.js
│   │       ├── categoryController.js
│   │       ├── messageController.js
│   │       ├── reportController.js
│   │       └── adminController.js
│   ├── database/
│   │   ├── schema.sql         ← Schéma complet de la BDD
│   │   ├── seed.sql           ← Données de test
│   │   ├── init.js            ← Script d'initialisation
│   │   └── skillmap.db        ← Fichier SQLite (auto-créé)
│   ├── server.js              ← Point d'entrée
│   ├── package.json
│   └── .env                   ← Variables d'environnement
│
└── frontend/                  ← Fichiers HTML (vos pages existantes)
    ├── skillmap.html          ← Page d'accueil
    ├── login.html             ← Connexion / Inscription
    ├── dashboard-client.html  ← Dashboard client (recherche + carte)
    ├── dashboard-prestataire.html ← Dashboard prestataire
    └── js/
        ├── api.js             ← Couche d'abstraction API
        ├── auth.js            ← Logique d'authentification
        ├── dashboard-client.js
        └── dashboard-prestataire.js
```

---

## API Routes

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → JWT |
| GET | `/api/auth/me` | Profil connecté |
| PUT | `/api/auth/password` | Changer mot de passe |

### Prestataires
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/providers` | Liste avec filtres géo |
| GET | `/api/providers/:id` | Fiche détaillée |
| PUT | `/api/providers/me/profile` | Mettre à jour profil |
| PATCH | `/api/providers/me/availability` | Toggle disponibilité |

**Paramètres de recherche :** `q`, `category`, `lat`, `lng`, `radius`, `available`, `sort`, `page`, `limit`

### Services
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/services` | Mes demandes |
| POST | `/api/services` | Créer une demande |
| PATCH | `/api/services/:id/status` | Changer statut |

### Avis
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/providers/:id/reviews` | Avis d'un prestataire |
| POST | `/api/providers/:id/reviews` | Laisser un avis |

### Favoris
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/favorites` | Mes favoris |
| POST | `/api/favorites/:id` | Ajouter |
| DELETE | `/api/favorites/:id` | Retirer |

### Admin
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/stats` | Statistiques globales |
| GET | `/api/admin/users` | Liste utilisateurs |
| PATCH | `/api/admin/providers/:id/verify` | Vérifier prestataire |
| GET | `/api/admin/reports` | Signalements |

---

## Variables d'environnement (`.env`)

```env
PORT=3001
JWT_SECRET=votre_secret_jwt_ici
JWT_EXPIRES_IN=7d
DB_PATH=./database/skillmap.db
NODE_ENV=development
```

---

## Schéma de base de données

```
users          ← Tous les utilisateurs (client / provider / admin)
providers      ← Profils prestataires avec coordonnées GPS
categories     ← Catégories de services
provider_categories  ← Many-to-many
provider_skills      ← Compétences
portfolio_items      ← Portfolio
service_requests     ← Demandes de service
reviews              ← Avis et notations
favorites            ← Favoris des clients
messages             ← Messagerie
reports              ← Signalements
```
