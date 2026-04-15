const { Router } = require('express');
const { list, get, invite, updateRole, remove } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/',           list);
router.get('/:id',        get);
router.post('/invite',    authorize('admin'), invite);
router.patch('/:id/role', authorize('admin'), updateRole);
router.delete('/:id',     authorize('admin'), remove);

module.exports = router;
