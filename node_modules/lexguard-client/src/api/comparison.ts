import api from './client.js';
import type { ComparisonResult } from '../types/index.js';

export async function compareContractsApi(contractIdA: string, contractIdB: string) {
  const res = await api.post<{ comparison: ComparisonResult }>('/compare', { contractIdA, contractIdB });
  return res.data.comparison;
}