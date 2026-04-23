const router = require('express').Router();
const ctrl   = require('../controllers/favoriteController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/',                            authenticate, requireRole('client'), ctrl.list);
router.post('/:provider_id',               authenticate, requireRole('client'), ctrl.add);
router.delete('/:provider_id',             authenticate, requireRole('client'), ctrl.remove);
router.get('/:provider_id/check',          authenticate, requireRole('client'), ctrl.check);

module.exports = router;
