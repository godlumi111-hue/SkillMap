-- SkillMap — Données de test enrichies
-- Mots de passe hashés = "password123" pour tous les utilisateurs de test

-- ─── CATÉGORIES ──────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, icon) VALUES
  ('Artisanat',           'artisanat',   '🔧'),
  ('Électricité',         'electricite', '⚡'),
  ('Plomberie',           'plomberie',   '🚿'),
  ('Beauté & Coiffure',   'beaute',      '✂️'),
  ('Design & Créatif',    'design',      '🎨'),
  ('Éducation & Cours',   'education',   '📚'),
  ('Téléphonie & Tech',   'telephonie',  '🔌'),
  ('Mécanique Auto',      'mecanique',   '🚗'),
  ('Couture & Mode',      'couture',     '🪡'),
  ('Cuisine & Traiteur',  'cuisine',     '🍽️');

-- ─── UTILISATEURS (mdp = "password123") ─────────────────────
-- Admin
INSERT OR IGNORE INTO users (id, email, password, role, full_name, city)
VALUES (1, 'admin@skillmap.ci',
  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm',
  'admin', 'Admin SkillMap', 'Abidjan');

-- Clients
INSERT OR IGNORE INTO users (id, email, password, role, full_name, city, phone) VALUES
  (2, 'marie@test.ci',  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'client', 'Marie-Claire Gnahore', 'Abidjan', '+225 07 12 34 56'),
  (3, 'jean@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'client', 'Jean-Paul Assi',        'Abidjan', '+225 05 98 76 54');

-- Prestataires — Batch 1 (IDs 4–10, original)
INSERT OR IGNORE INTO users (id, email, password, role, full_name, city, phone) VALUES
  (4,  'kone@test.ci',     '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Koné Oumar',          'Abidjan', '+225 07 45 67 89'),
  (5,  'aicha@test.ci',    '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Aïcha Touré',         'Abidjan', '+225 05 23 45 67'),
  (6,  'bamba@test.ci',    '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Bamba Diabaté',       'Abidjan', '+225 07 89 01 23'),
  (7,  'fatou@test.ci',    '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Fatou Kouyaté',       'Abidjan', '+225 05 34 56 78'),
  (8,  'moussa@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Moussa Sanogo',       'Abidjan', '+225 07 67 89 01'),
  (9,  'ibrahim@test.ci',  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Ibrahim Bah',         'Abidjan', '+225 05 56 78 90'),
  (10, 'sylvie@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Sylvie Adjoua',       'Abidjan', '+225 07 78 90 12');

-- Prestataires — Batch 2 (IDs 11–33, nouveaux)
INSERT OR IGNORE INTO users (id, email, password, role, full_name, city, phone) VALUES
  (11, 'amadou@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Amadou Coulibaly',    'Abidjan', '+225 07 11 22 33'),
  (12, 'clarisse@test.ci', '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Clarisse Koffi',      'Abidjan', '+225 05 44 55 66'),
  (13, 'patrick@test.ci',  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Ouédraogo Patrick',   'Abidjan', '+225 07 33 44 55'),
  (14, 'nathalie@test.ci', '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Nathalie Séka',       'Abidjan', '+225 05 77 88 99'),
  (15, 'emmanuel@test.ci', '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Emmanuel Brou',       'Abidjan', '+225 07 22 33 44'),
  (16, 'hortense@test.ci', '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Hortense Gnagna',     'Abidjan', '+225 05 55 66 77'),
  (17, 'boubacar@test.ci', '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Boubacar Diallo',     'Abidjan', '+225 07 44 55 66'),
  (18, 'raissa@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Raïssa Touré',        'Abidjan', '+225 05 88 99 00'),
  (19, 'serge@test.ci',    '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Serge Kouamé',        'Abidjan', '+225 07 66 77 88'),
  (20, 'aminata@test.ci',  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Aminata Diabaté',     'Abidjan', '+225 05 11 22 33'),
  (21, 'charles@test.ci',  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Charles Kessé',       'Abidjan', '+225 07 55 66 77'),
  (22, 'mariam@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Mariam Sanogo',       'Abidjan', '+225 05 22 33 44'),
  (23, 'theo@test.ci',     '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Théodore Yapi',       'Abidjan', '+225 07 88 99 00'),
  (24, 'adele@test.ci',    '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Adèle Traoré',        'Abidjan', '+225 05 33 44 55'),
  (25, 'olivier@test.ci',  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Olivier Zran',        'Abidjan', '+225 07 11 44 77'),
  (26, 'josephine@test.ci','$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Joséphine Aka',       'Abidjan', '+225 05 66 77 88'),
  (27, 'mamadou@test.ci',  '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Mamadou Sawaneh',     'Abidjan', '+225 07 77 88 99'),
  (28, 'cecile@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Cécile Bah',          'Abidjan', '+225 05 99 00 11'),
  (29, 'samuel@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Samuel Ouattara',     'Abidjan', '+225 07 00 11 22'),
  (30, 'prisca@test.ci',   '$2a$10$JBq7NGXwhFVTgVQboQi6IOJ1//lr9lsOXxxchRMZE6qbfltMsOCFm', 'provider', 'Prisca Yéboua',       'Abidjan', '+225 05 44 77 00');

-- ─── PROFILS PRESTATAIRES ───────────────────────────────────
-- Coordonnées GPS autour d'Abidjan (zones diverses)
INSERT OR IGNORE INTO providers (id, user_id, title, description, city, neighborhood, lat, lng, is_available, is_verified, hourly_rate, experience_years) VALUES
  -- Batch 1 (original)
  (1, 4,  'Plombier',
   'Plombier professionnel avec 8 ans d''expérience. Intervention rapide, travail soigné. Disponible 7j/7 pour urgences.',
   'Abidjan', 'Cocody', 5.3600, -3.9800, 1, 1, 5000, 8),
  (2, 5,  'Graphiste & UI Designer',
   'Créatrice visuelle passionnée. Logos, affiches, identités visuelles, maquettes UI/UX. Livraison rapide et qualité premium.',
   'Abidjan', 'Plateau', 5.3190, -4.0180, 1, 1, 8000, 5),
  (3, 6,  'Électricien',
   'Électricien certifié, spécialisé en câblage résidentiel et commercial. Tableau électrique, dépannage, installation solaire.',
   'Abidjan', 'Yopougon', 5.3630, -4.0450, 0, 0, 6000, 10),
  (4, 7,  'Coiffeuse',
   'Coiffeuse expérimentée, spécialiste des cheveux afro. Tresses, défrisage, colorations naturelles, soins kératine.',
   'Abidjan', 'Marcory', 5.3000, -3.9900, 1, 1, 4000, 6),
  (5, 8,  'Mécanicien Auto',
   'Mécanicien agréé, diagnostic électronique, révision complète, réparation moteur. Pièces d''origine garanties.',
   'Abidjan', 'Adjamé', 5.3550, -4.0230, 1, 0, 7000, 12),
  (6, 9,  'Réparateur Téléphone & Informatique',
   'Réparation rapide smartphones, tablettes, ordinateurs. Écrans, batteries, software. Devis gratuit.',
   'Abidjan', 'Treichville', 5.3000, -3.9800, 1, 0, 3000, 4),
  (7, 10, 'Couturière',
   'Couturière créative, confection sur mesure, retouches, robes de mariée, tenues traditionnelles wax.',
   'Abidjan', 'Treichville', 5.2990, -3.9810, 1, 1, 4500, 7),

  -- Batch 2 (nouveaux)
  (8,  11, 'Maçon & Carreleur',
   'Maçon qualifié, pose de carrelage, enduits, construction de murs et fondations. Travail propre et rapide, devis gratuit.',
   'Abidjan', 'Abobo', 5.4100, -4.0400, 1, 1, 5500, 9),
  (9,  12, 'Coiffeuse & Maquilleuse',
   'Spécialiste coiffure et maquillage pour mariages, soirées et shooting photo. Déplacement à domicile possible.',
   'Abidjan', 'Angré', 5.3800, -3.9700, 1, 1, 5000, 4),
  (10, 13, 'Menuisier & Ébéniste',
   'Fabrication de meubles sur mesure, portes, fenêtres, placards. Bois massif et panneaux. Finitions soignées.',
   'Abidjan', 'Yopougon', 5.3620, -4.0460, 0, 1, 6500, 14),
  (11, 14, 'Chef Traiteur',
   'Traiteur pour événements, buffets, repas d''entreprise. Cuisine africaine et internationale. Minimum 20 personnes.',
   'Abidjan', 'Cocody', 5.3700, -3.9600, 1, 1, 9000, 7),
  (12, 15, 'Électricien Résidentiel',
   'Installation et dépannage électrique, pose de luminaires, prises et interrupteurs. Intervention d''urgence disponible.',
   'Abidjan', 'Marcory', 5.2980, -3.9920, 1, 0, 5500, 6),
  (13, 16, 'Professeur de Mathématiques',
   'Prof de maths et physique, lycée et classes préparatoires. Méthode rigoureuse, résultats garantis. Cours particuliers à domicile.',
   'Abidjan', 'Plateau', 5.3200, -4.0200, 1, 1, 7000, 10),
  (14, 17, 'Peintre en Bâtiment',
   'Peinture intérieure et extérieure, enduits décoratifs, ravalement de façade. Travail soigné avec matériaux de qualité.',
   'Abidjan', 'Adjamé', 5.3560, -4.0220, 1, 0, 4000, 8),
  (15, 18, 'Designer Graphique',
   'Identité visuelle, affiches publicitaires, flyers, réseaux sociaux. Design moderne et original. Délais respectés.',
   'Abidjan', 'Treichville', 5.3010, -3.9790, 1, 1, 7500, 5),
  (16, 19, 'Mécanicien Auto & Moto',
   'Réparation automobiles et motos toutes marques. Vidange, freins, embrayage, électronique. Garage ouvert 6j/7.',
   'Abidjan', 'Koumassi', 5.2910, -3.9510, 1, 0, 6000, 11),
  (17, 20, 'Couturière Haute Couture',
   'Confection de robes de soirée, costumes traditionnels, uniformes. Broderies et décors faits main. Atelier à Bingerville.',
   'Abidjan', 'Bingerville', 5.3570, -3.8840, 1, 1, 6000, 9),
  (18, 21, 'Technicien Informatique',
   'Réparation PC et Mac, installation Windows et logiciels, récupération de données, antivirus, réseaux WiFi.',
   'Abidjan', 'Yopougon', 5.3640, -4.0440, 1, 0, 3500, 5),
  (19, 22, 'Cuisinière & Traiteur Africain',
   'Spécialiste cuisine ivoirienne : foutou, attiéké, placali, kedjenou. Livraison possible. Commandes dès 2h à l''avance.',
   'Abidjan', 'Marcory', 5.3020, -3.9880, 1, 1, 4500, 6),
  (20, 23, 'Électricien Solaire',
   'Installation de panneaux solaires, batteries et onduleurs. Étude de faisabilité gratuite. Réduction de votre facture EDF garantie.',
   'Abidjan', 'Cocody', 5.3650, -3.9750, 1, 1, 10000, 6),
  (21, 24, 'Professeure d''Anglais & Français',
   'Cours de langues pour enfants et adultes. Préparation aux examens BEPC, BAC, TOEFL et IELTS. Cours en ligne disponible.',
   'Abidjan', 'Plateau', 5.3180, -4.0190, 1, 1, 6000, 8),
  (22, 25, 'Plombier Sanitaire',
   'Installation sanitaire complète, dépannage, chauffe-eau solaire, traitement de l''eau. Certifié et assuré.',
   'Abidjan', 'Port-Bouët', 5.2530, -3.9370, 1, 0, 5000, 7),
  (23, 26, 'Salon de Coiffure',
   'Tresses africaines, défrisage, colorations, soins capillaires. Salon climatisé, rendez-vous et sans rendez-vous.',
   'Abidjan', 'Koumassi', 5.2920, -3.9530, 1, 1, 3500, 5),
  (24, 27, 'Charpentier & Menuisier',
   'Construction de toitures, charpentes bois, portes et fenêtres. Aussi menuiserie métallique sur devis.',
   'Abidjan', 'Adjamé', 5.3570, -4.0210, 0, 0, 7000, 16),
  (25, 28, 'Photographe & Designer',
   'Photographie événementielle (mariages, baptêmes, entreprises), retouches photos, vidéo clip. Studio mobile.',
   'Abidjan', 'Cocody', 5.3580, -3.9820, 1, 1, 12000, 6),
  (26, 29, 'Mécanicien Motos & Scooters',
   'Réparation et entretien de motos et scooters. Pièces d''origine disponibles. Intervention rapide, prix abordables.',
   'Abidjan', 'Abobo', 5.4120, -4.0390, 1, 0, 3000, 8),
  (27, 30, 'Pâtissière & Traiteur Sucré',
   'Gâteaux sur commande (anniversaires, mariages), macarons, pâtisseries françaises et africaines. Livraison Abidjan.',
   'Abidjan', 'Angré', 5.3810, -3.9690, 1, 1, 5000, 4);

-- ─── COMPÉTENCES ─────────────────────────────────────────────
INSERT OR IGNORE INTO provider_skills (provider_id, skill) VALUES
  (1,'Installation'),(1,'Réparation'),(1,'Urgence 24h'),(1,'Salle de bain'),(1,'Chauffe-eau'),
  (2,'Logo & Identité'),(2,'Affiches'),(2,'UI/UX'),(2,'Réseaux sociaux'),(2,'Figma'),
  (3,'Câblage'),(3,'Tableau électrique'),(3,'Dépannage'),(3,'Éclairage'),(3,'Climatisation'),
  (4,'Tresses'),(4,'Colorations'),(4,'Soins'),(4,'Défrisage'),(4,'Extensions'),
  (5,'Diagnostic'),(5,'Vidange'),(5,'Freinage'),(5,'Moteur'),(5,'Climatisation auto'),
  (6,'Écrans brisés'),(6,'Batteries'),(6,'Software'),(6,'Virus'),(6,'Données perdues'),
  (7,'Confection'),(7,'Retouches'),(7,'Wax'),(7,'Mariage'),(7,'Uniforme'),
  -- Batch 2
  (8,'Carrelage'),(8,'Maçonnerie'),(8,'Enduits'),(8,'Fondations'),(8,'Construction'),
  (9,'Mariages'),(9,'Maquillage'),(9,'Tresses'),(9,'Shooting photo'),(9,'Domicile'),
  (10,'Meubles sur mesure'),(10,'Portes'),(10,'Fenêtres'),(10,'Placards'),(10,'Bois massif'),
  (11,'Buffet'),(11,'Cuisine africaine'),(11,'Cuisine internationale'),(11,'Événements'),(11,'Livraison'),
  (12,'Installation'),(12,'Dépannage'),(12,'Luminaires'),(12,'Urgences'),(12,'Rénovation'),
  (13,'Lycée'),(13,'Prépa'),(13,'Maths'),(13,'Physique'),(13,'Domicile'),
  (14,'Intérieur'),(14,'Extérieur'),(14,'Façade'),(14,'Enduits décoratifs'),(14,'Ravalement'),
  (15,'Identité visuelle'),(15,'Affiches'),(15,'Flyers'),(15,'Social media'),(15,'Impression'),
  (16,'Toutes marques'),(16,'Vidange'),(16,'Freins'),(16,'Embrayage'),(16,'Électronique'),
  (17,'Broderies'),(17,'Haute couture'),(17,'Robes de soirée'),(17,'Tenues wax'),(17,'Sur mesure'),
  (18,'Windows'),(18,'Mac'),(18,'Récupération données'),(18,'Antivirus'),(18,'Réseaux WiFi'),
  (19,'Foutou'),(19,'Attiéké'),(19,'Kedjenou'),(19,'Cuisine ivoirienne'),(19,'Livraison'),
  (20,'Panneaux solaires'),(20,'Batteries'),(20,'Onduleurs'),(20,'Étude gratuite'),(20,'Maintenance'),
  (21,'Anglais'),(21,'Français'),(21,'TOEFL'),(21,'BAC'),(21,'Cours en ligne'),
  (22,'Sanitaire'),(22,'Chauffe-eau solaire'),(22,'Traitement eau'),(22,'Certifié'),(22,'Dépannage'),
  (23,'Tresses africaines'),(23,'Défrisage'),(23,'Colorations'),(23,'Soins capillaires'),(23,'Sans rendez-vous'),
  (24,'Toitures'),(24,'Charpente'),(24,'Portes'),(24,'Fenêtres'),(24,'Menuiserie métallique'),
  (25,'Mariages'),(25,'Baptêmes'),(25,'Entreprises'),(25,'Retouches'),(25,'Vidéo clip'),
  (26,'Réparation motos'),(26,'Entretien'),(26,'Pièces d''origine'),(26,'Scooters'),(26,'Prix abordables'),
  (27,'Gâteaux'),(27,'Macarons'),(27,'Pâtisserie française'),(27,'Anniversaires'),(27,'Livraison');

-- ─── CATÉGORIES PRESTATAIRES ────────────────────────────────
INSERT OR IGNORE INTO provider_categories VALUES
  (1,3),(2,5),(3,2),(4,4),(5,8),(6,7),(7,9),
  (8,1),(9,4),(10,1),(11,10),(12,2),(13,6),(14,1),(15,5),
  (16,8),(17,9),(18,7),(19,10),(20,2),(21,6),(22,3),(23,4),
  (24,1),(25,5),(26,8),(27,10);

-- ─── AVIS ──────────────────────────────────────────────────
INSERT OR IGNORE INTO reviews (client_id, provider_id, rating, comment, created_at) VALUES
  (2, 1, 5, 'Intervention en 30 minutes, problème réglé. Très professionnel.', datetime('now','-10 days')),
  (3, 1, 5, 'Excellent travail, tarif raisonnable. Je recommande vivement.', datetime('now','-8 days')),
  (2, 1, 4, 'Bon travail mais légèrement en retard sur le rendez-vous.', datetime('now','-5 days')),
  (3, 2, 5, 'Logo magnifique, livrée en 24h. Talent incroyable !', datetime('now','-15 days')),
  (2, 2, 5, 'Travail créatif et professionnel. Notre identité visuelle est parfaite.', datetime('now','-7 days')),
  (2, 4, 5, 'Tresses impeccables, salon propre, ambiance agréable.', datetime('now','-12 days')),
  (3, 5, 4, 'Révision complète faite rapidement. Prix correct.', datetime('now','-6 days')),
  (2, 6, 5, 'Écran changé en 2h, fonctionne comme neuf. Super service.', datetime('now','-3 days')),
  (2, 8, 5, 'Carrelage parfait, finitions impeccables. Très sérieux.', datetime('now','-20 days')),
  (3, 8, 4, 'Bon maçon, travail propre. Légèrement plus long que prévu.', datetime('now','-15 days')),
  (2, 9, 5, 'Maquillage de rêve pour mon mariage ! Toutes mes invitées ont demandé son contact.', datetime('now','-30 days')),
  (3, 11, 5, 'Buffet exceptionnel pour notre réunion d''entreprise. 50 personnes régalées.', datetime('now','-25 days')),
  (2, 11, 5, 'Chef incroyable, cuisine parfumée et délicieuse. Je recommande à 100%.', datetime('now','-18 days')),
  (3, 13, 5, 'Mon fils est passé de 7/20 à 16/20 en maths en 2 mois. Merci !', datetime('now','-40 days')),
  (2, 13, 5, 'Excellent professeur, pédagogue et patient. Ma fille adore ses cours.', datetime('now','-35 days')),
  (2, 15, 5, 'Affiches pour mon événement, rendu superbe. Délais respectés.', datetime('now','-22 days')),
  (3, 15, 4, 'Bon designer, créatif. Communication parfois lente mais résultat top.', datetime('now','-10 days')),
  (2, 19, 5, 'Kedjenou divin, livraison dans les temps. Ma famille a adoré.', datetime('now','-8 days')),
  (3, 20, 5, 'Installation solaire professionnelle, économies immédiates sur la facture.', datetime('now','-45 days')),
  (2, 21, 5, 'Mon fils a eu son BEPC avec mention grâce à Adèle. Mille mercis.', datetime('now','-60 days')),
  (3, 25, 5, 'Photos de mariage magnifiques, vidéo clip réalisée avec talent.', datetime('now','-14 days')),
  (2, 27, 5, 'Gâteau d''anniversaire sublime, goût exceptionnel. Toute la famille a été bluffée.', datetime('now','-7 days'));

-- ─── MESSAGES DE DÉMONSTRATION ─────────────────────────────
INSERT OR IGNORE INTO messages (sender_id, receiver_id, content, created_at) VALUES
  (2, 4, 'Bonjour, êtes-vous disponible demain matin pour une fuite d''eau ?', datetime('now','-2 days')),
  (4, 2, 'Bonjour ! Oui je suis disponible à partir de 8h. Quelle est votre adresse ?', datetime('now','-2 days','+5 minutes')),
  (2, 4, 'Je suis à Cocody, Riviera 3. C''est urgent, la fuite est sous l''évier.', datetime('now','-2 days','+10 minutes')),
  (4, 2, 'Pas de problème, je serai là à 8h30. Préparez de l''espace sous l''évier.', datetime('now','-2 days','+15 minutes')),
  (3, 8, 'Bonjour, combien coûte une révision complète pour une Toyota Corolla 2018 ?', datetime('now','-1 day')),
  (8, 3, 'Bonjour ! Pour une Corolla 2018, comptez 45 000 FCFA pour une révision complète avec vidange et filtres.', datetime('now','-1 day','+20 minutes')),
  (2, 14, 'Bonjour Nathalie, avez-vous de la disponibilité pour un buffet de 30 personnes samedi prochain ?', datetime('now','-3 days')),
  (14, 2, 'Bonjour ! Oui je suis disponible samedi. Quel est le menu souhaité ? Africain ou mixte ?', datetime('now','-3 days','+10 minutes'));

-- ─── DEMANDES DE SERVICE ────────────────────────────────────
INSERT OR IGNORE INTO service_requests (client_id, provider_id, title, description, status, created_at) VALUES
  (2, 1, 'Réparation fuite robinet cuisine', 'Le robinet de la cuisine fuit depuis 2 jours, perte d''eau importante.', 'completed', datetime('now','-10 days')),
  (3, 2, 'Création logo entreprise', 'Besoin d''un logo moderne pour ma startup tech. Couleurs : bleu et orange.', 'completed', datetime('now','-15 days')),
  (2, 4, 'Tresses box braids', 'Tresses box braids longueur mi-dos, couleur naturelle.', 'completed', datetime('now','-12 days')),
  (3, 5, 'Révision 60 000 km', 'Révision complète + vidange + contrôle freins Toyota Corolla 2018.', 'accepted', datetime('now','-1 day')),
  (2, 6, 'Remplacement écran iPhone 13', 'Écran fissuré suite à une chute. Besoin d''un remplacement rapide.', 'completed', datetime('now','-3 days')),
  (2, 11, 'Buffet entreprise 30 couverts', 'Réunion annuelle, buffet cuisine africaine + internationale, 30 personnes.', 'pending', datetime('now','-1 day')),
  (3, 13, 'Cours de maths — Terminale', 'Mon fils en Terminale C a besoin de renforcement en maths et physique.', 'accepted', datetime('now','-5 days'));
