const { Router } = require('express');
const { list, get, create, update, remove, importProducts } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.post('/import', importProducts);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
