const { Router } = require('express');
const { list, get, create, updateStatus, remove } = require('../controllers/purchaseOrderController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/',              list);
router.get('/:id',           get);
router.post('/',             create);
router.patch('/:id/status',  updateStatus);
router.delete('/:id',        remove);

module.exports = router;
