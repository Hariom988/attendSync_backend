import { Router } from 'express';
import { adminLogin, me, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.post('/admin/login', adminLogin);
router.post('/logout', logout);
router.get('/me', authenticate, authorize('admin'), me);

export default router;