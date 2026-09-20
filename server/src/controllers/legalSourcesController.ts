import { Request, Response } from 'express';
import { getRepository } from '../db/repository.js';
import { getEmbeddingProvider } from '../ai/providerFactory.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export async function listLegalSources(req: Request, res: Response) {
  try {
    const { search, jurisdiction } = req.query;
    const repo = await getRepository();
    const sources = await repo.getLegalSources(search as string, jurisdiction as string);
    return res.json({ sources });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function addLegalSource(req: AuthRequest, res: Response) {
  try {
    const { title, source, jurisdiction, section, url, content } = req.body;
    if (!title || !source || !jurisdiction || !content) {
      return res.status(400).json({ error: 'title, source, jurisdiction, and content are required' });
    }

    const embedder = getEmbeddingProvider();
    let embedding: number[] | undefined;
    try {
      embedding = await embedder.generateEmbedding(`${title} ${content}`);
    } catch (e) {}

    const repo = await getRepository();
    const created = await repo.addLegalSource({
      title,
      source,
      jurisdiction,
      section,
      url,
      content,
      contentSnippet: content.slice(0, 300),
      embedding
    });

    await repo.logAudit('LEGAL_SOURCE_ADDED', 'legal_source', created.id, req.user?.id);
    return res.status(201).json({ source: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
