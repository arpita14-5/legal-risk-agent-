import { Router } from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateJWT);
router.get('/', globalSearch);

export default router;
