import { Response } from 'express';
import { getRepository } from '../db/repository.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export async function globalSearch(req: AuthRequest, res: Response) {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q) return res.json({ contracts: [], clauses: [], risks: [], legalSources: [] });

    const repo = await getRepository();
    const userId = req.user?.id || '';

    // Search user contracts
    const contracts = await repo.listContracts(userId, { search: q });

    // Search legal sources
    const legalSources = await repo.getLegalSources(q);

    return res.json({
      contracts,
      legalSources
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
