const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/walletController');

router.get('/',         authenticate, ctrl.getWallet);
router.post('/deposit', authenticate, ctrl.deposit);
router.get('/stats',    authenticate, ctrl.stats);

module.exports = router;
