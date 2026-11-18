import { Router } from 'express';
import { adminLogin, userLogin, me, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.post('/admin/login', adminLogin);
router.post('/login', userLogin);
router.post('/logout', logout);
router.get('/me', authenticate, authorize('admin', 'hr', 'employee'), me);

export default router;