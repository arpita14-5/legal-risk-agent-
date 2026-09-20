import api from './client.js';
import type { SystemObservability } from '../types/index.js';

export async function fetchObservabilityStats() {
  const res = await api.get<{ metrics: SystemObservability; logs: any[]; totalUsers: number }>('/admin/observability');
  return res.data;
}