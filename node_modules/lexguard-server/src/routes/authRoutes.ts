import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
