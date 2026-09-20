import { getRepository } from '../db/repository.js';
import type { LegalSourceCitation } from '../types/shared.js';

export class ResearchAgent {
  name = 'Legal Research Agent';

  async findRelevantLegalAuthorities(topics: string[]): Promise<LegalSourceCitation[]> {
    const repo = await getRepository();
    const results: LegalSourceCitation[] = [];
    const seen = new Set<string>();

    for (const topic of topics) {
      const sources = await repo.searchLegalSources(topic, undefined, 2);
      for (const s of sources) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          results.push(s);
        }
      }
    }

    return results;
  }
}
