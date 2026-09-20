import { Router } from 'express';
import authRoutes from './authRoutes.js';
import contractRoutes from './contractRoutes.js';
import comparisonRoutes from './comparisonRoutes.js';
import legalSourcesRoutes from './legalSourcesRoutes.js';
import searchRoutes from './searchRoutes.js';
import adminRoutes from './adminRoutes.js';
import { getFeedbackEvaluationSummary } from '../controllers/contractController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/contracts', contractRoutes);
apiRouter.use('/contracts/compare', comparisonRoutes);
apiRouter.use('/compare', comparisonRoutes);
apiRouter.use('/legal-sources', legalSourcesRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.get('/evaluation/feedback-summary', authenticateJWT, getFeedbackEvaluationSummary);

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'LexGuard Legal Intelligence' });
});

export default apiRouter;
