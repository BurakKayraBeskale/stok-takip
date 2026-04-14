const { Router } = require('express');
const { list, get, upsert, lowStock } = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', list);
router.get('/low-stock', lowStock);
router.get('/:id', get);
router.post('/', upsert);

module.exports = router;
