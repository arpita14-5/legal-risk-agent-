import { Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { getRepository } from '../db/repository.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const orchestrator = new AgentOrchestrator();

export async function sendChatMessage(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question string is required' });
    }

    const repo = await getRepository();
    // Save user's message in chat history
    await repo.saveChatMessage(id, {
      role: 'user',
      content: question
    });

    // Run grounded RAG answering and claim verification
    const reply = await orchestrator.answerContractQuestion(id, question);
    return res.json({ message: reply });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getChatHistory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const repo = await getRepository();
    const history = await repo.getChatHistory(id);
    return res.json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
