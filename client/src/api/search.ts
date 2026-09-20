import api from './client.js';
import type { ContractDocument, LegalSourceCitation } from '../types/index.js';

export async function globalSearchApi(q: string) {
  const res = await api.get<{ contracts: ContractDocument[]; legalSources: LegalSourceCitation[] }>('/search', { params: { q } });
  return res.data;
}