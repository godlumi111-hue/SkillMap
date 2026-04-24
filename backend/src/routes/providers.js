const router = require('express').Router();
const ctrl         = require('../controllers/providerController');
const reviewCtrl   = require('../controllers/reviewController');
const reportCtrl   = require('../controllers/reportController');
const uploadCtrl   = require('../controllers/uploadController');
const portfolioCtrl = require('../controllers/portfolioController');
const { authenticate, requireRole } = require('../middleware/auth');

// Routes publiques
router.get('/', ctrl.list);

// Portfolio public — doit être avant /:id
router.get('/me/portfolio', authenticate, requireRole('provider'), portfolioCtrl.list);

// Route publique par ID
router.get('/:id', ctrl.getOne);

// Portfolio public par prestataire
router.get('/:id/portfolio', portfolioCtrl.listPublic);

// Reviews
router.get('/:id/reviews',  reviewCtrl.listForProvider);
router.post('/:id/reviews', authenticate, requireRole('client'), reviewCtrl.create);

// Signalement
router.post('/:id/report', authenticate, reportCtrl.create);

// Routes prestataire connecté
router.put('/me/profile',          authenticate, requireRole('provider'), ctrl.updateProfile);
router.patch('/me/availability',   authenticate, requireRole('provider'), ctrl.toggleAvailability);
router.post('/me/avatar',          authenticate, uploadCtrl.uploadAvatar);

// Portfolio (réalisations)
router.post('/me/portfolio',       authenticate, requireRole('provider'), portfolioCtrl.create);
router.put('/me/portfolio/:id',    authenticate, requireRole('provider'), portfolioCtrl.update);
router.delete('/me/portfolio/:id', authenticate, requireRole('provider'), portfolioCtrl.remove);

module.exports = router;
