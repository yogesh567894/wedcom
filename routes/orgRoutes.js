const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { createOrg, loginAdmin, getOrg, updateOrg, deleteOrg } = require('../controllers/orgController');

router.post('/org/create', createOrg);
router.post('/admin/login', loginAdmin);
router.get('/org/get', getOrg);
router.put('/org/update', verifyToken, updateOrg);
router.delete('/org/delete', verifyToken, deleteOrg);

module.exports = router;
