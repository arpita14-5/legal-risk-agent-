import { Router } from 'express';
import { listLegalSources, addLegalSource } from '../controllers/legalSourcesController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', listLegalSources);
router.post('/', authenticateJWT, requireAdmin, addLegalSource);

export default router;
