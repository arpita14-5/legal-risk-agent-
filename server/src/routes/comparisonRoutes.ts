import { Router } from 'express';
import { compareContracts } from '../controllers/comparisonController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateJWT);
router.post('/', compareContracts);

export default router;
