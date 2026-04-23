const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/appointmentController');

router.get('/',                authenticate, ctrl.list);
router.post('/',               authenticate, requireRole('client'), ctrl.create);
router.get('/:id',             authenticate, ctrl.getOne);
router.patch('/:id/status',    authenticate, ctrl.updateStatus);
router.post('/:id/pay',        authenticate, requireRole('client'), ctrl.pay);
router.post('/:id/confirm-complete', authenticate, requireRole('client'), ctrl.confirmComplete);

module.exports = router;
