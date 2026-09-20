import api from './client.js';
import type { LegalSourceCitation } from '../types/index.js';

export async function fetchLegalSourcesApi(params?: { search?: string; jurisdiction?: string }) {
  const res = await api.get<{ sources: LegalSourceCitation[] }>('/legal-sources', { params });
  return res.data.sources;
}

export async function createLegalSourceApi(data: { title: string; source: string; jurisdiction: string; section?: string; url?: string; content: string }) {
  const res = await api.post<{ source: LegalSourceCitation }>('/legal-sources', data);
  return res.data.source;
}