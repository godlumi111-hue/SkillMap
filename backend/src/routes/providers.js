const router = require('express').Router();
const ctrl   = require('../controllers/providerController');
const reviewCtrl = require('../controllers/reviewController');
const reportCtrl = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');

// Routes publiques
router.get('/',       ctrl.list);
router.get('/:id',    ctrl.getOne);

// Reviews
router.get('/:id/reviews',  reviewCtrl.listForProvider);
router.post('/:id/reviews', authenticate, requireRole('client'), reviewCtrl.create);

// Signalement
router.post('/:id/report',  authenticate, reportCtrl.create);

// Routes prestataire connecté
router.put('/me/profile',       authenticate, requireRole('provider'), ctrl.updateProfile);
router.patch('/me/availability', authenticate, requireRole('provider'), ctrl.toggleAvailability);

module.exports = router;
