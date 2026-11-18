import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createHr, listHrs, getHr } from '../controllers/hrController.js';
import { createEmployee, listEmployees, getEmployee } from '../controllers/employeeController.js';
const router = Router();
router.use(authenticate, authorize('admin'));

router.post('/employees', createEmployee);
router.get('/employees', listEmployees);
router.get('/employees/:id', getEmployee);


router.post('/hrs', createHr);
router.get('/hrs', listHrs);
router.get('/hrs/:id', getHr);

export default router;