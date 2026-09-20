import { Router } from 'express';
import { getObservabilityStats, listUsers } from '../controllers/adminController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateJWT);
router.use(requireAdmin);

router.get('/observability', getObservabilityStats);
router.get('/users', listUsers);

export default router;
