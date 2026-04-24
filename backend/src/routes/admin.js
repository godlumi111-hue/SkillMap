const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

const guard = [authenticate, requireRole('admin')];

router.get('/stats',              ...guard, ctrl.stats);
router.get('/users',              ...guard, ctrl.listUsers);
router.patch('/users/:id',        ...guard, ctrl.updateUser);
router.patch('/providers/:id/verify', ...guard, ctrl.verifyProvider);
router.get('/reports',            ...guard, ctrl.listReports);
router.patch('/reports/:id',      ...guard, ctrl.handleReport);
router.get('/reviews',            ...guard, ctrl.listReviews);
router.patch('/reviews/:id',      ...guard, ctrl.moderateReview);
router.get('/wallet',             ...guard, ctrl.walletStats);

module.exports = router;
