import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createHr, listHrs, getHr } from '../controllers/hrController.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/hrs', createHr);
router.get('/hrs', listHrs);
router.get('/hrs/:id', getHr);

export default router;