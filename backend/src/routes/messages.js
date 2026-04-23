const router = require('express').Router();
const ctrl   = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get('/conversations',   authenticate, ctrl.conversations);
router.get('/:user_id',        authenticate, ctrl.thread);
router.post('/:user_id',       authenticate, ctrl.send);

module.exports = router;
