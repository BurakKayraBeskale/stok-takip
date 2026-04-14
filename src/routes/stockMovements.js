const { Router } = require('express');
const { list, get, create } = require('../controllers/stockMovementController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/',    list);
router.get('/:id', get);
router.post('/',   create);

module.exports = router;
