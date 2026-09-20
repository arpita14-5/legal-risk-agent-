import { Response } from 'express';
import { getRepository } from '../db/repository.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export async function getObservabilityStats(req: AuthRequest, res: Response) {
  try {
    const repo = await getRepository();
    const metrics = await repo.getObservabilityMetrics();
    const logs = await repo.getAuditLogs(30);
    const users = await repo.getAllUsers();

    return res.json({
      metrics,
      logs,
      totalUsers: users.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const repo = await getRepository();
    const users = await repo.getAllUsers();
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
