const { Router } = require('express');
const { stockReport } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);
router.get('/stock', stockReport);

module.exports = router;
