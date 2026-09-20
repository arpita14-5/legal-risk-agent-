import { Response } from 'express';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const orchestrator = new AgentOrchestrator();

export async function compareContracts(req: AuthRequest, res: Response) {
  try {
    const { contractIdA, contractIdB } = req.body;
    if (!contractIdA || !contractIdB) {
      return res.status(400).json({ error: 'contractIdA and contractIdB are both required' });
    }

    const comparison = await orchestrator.compareContracts(contractIdA, contractIdB);
    return res.json({ comparison });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
