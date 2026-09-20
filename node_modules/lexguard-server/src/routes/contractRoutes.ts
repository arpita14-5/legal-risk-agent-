import { Router } from 'express';
import {
  uploadContract,
  listContracts,
  getContract,
  deleteContract,
  analyzeContract,
  getAnalysis,
  getRisks,
  getClauses,
  getReport,
  submitRiskFeedback,
  getContractRiskFeedback
} from '../controllers/contractController.js';
import { sendChatMessage, getChatHistory } from '../controllers/chatController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', upload.single('document'), uploadContract);
router.get('/', listContracts);
router.get('/:id', getContract);
router.delete('/:id', deleteContract);
router.post('/:id/analyze', analyzeContract);
router.get('/:id/analysis', getAnalysis);
router.get('/:id/risks', getRisks);
router.post('/:id/risks/:riskId/feedback', submitRiskFeedback);
router.get('/:id/risks/feedback', getContractRiskFeedback);
router.get('/:id/clauses', getClauses);
router.get('/:id/report', getReport);

// Contract Chat
router.post('/:id/chat', sendChatMessage);
router.get('/:id/chat', getChatHistory);

export default router;
