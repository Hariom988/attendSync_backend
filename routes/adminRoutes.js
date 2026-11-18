import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createHr, listHrs, getHr } from '../controllers/hrController.js';
import { createEmployee, listEmployees, getEmployee, updateAssignment } from '../controllers/employeeController.js';
import { makeLookupController } from '../controllers/lookupController.js';

const router = Router();
const departments = makeLookupController('departments', 'department');
const shifts = makeLookupController('shifts', 'shift');

router.use(authenticate, authorize('admin'));

router.post('/employees', createEmployee);
router.get('/employees', listEmployees);
router.get('/employees/:id', getEmployee);


router.post('/hrs', createHr);
router.get('/hrs', listHrs);
router.get('/hrs/:id', getHr);

router.post('/departments', departments.create);
router.get('/departments', departments.list);
router.post('/shifts', shifts.create);
router.get('/shifts', shifts.list);
router.patch('/employees/:id/assignment', updateAssignment);

export default router;