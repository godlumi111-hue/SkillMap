const router = require('express').Router();
const ctrl   = require('../controllers/serviceController');
const { authenticate } = require('../middleware/auth');

router.get('/',               authenticate, ctrl.list);
router.post('/',              authenticate, ctrl.create);
router.patch('/:id/status',   authenticate, ctrl.updateStatus);

module.exports = router;
