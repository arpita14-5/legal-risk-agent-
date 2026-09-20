import api from './client.js';
import type {
  ContractDocument,
  ContractAnalysis,
  RiskFinding,
  Clause,
  ChatMessage
} from '../types/index.js';

export async function fetchContracts(params?: { search?: string; status?: string; riskLevel?: string; type?: string }) {
  const res = await api.get<{ contracts: ContractDocument[] }>('/contracts', { params });
  return res.data.contracts;
}

export async function fetchContract(id: string) {
  const res = await api.get<{ contract: ContractDocument }>(`/contracts/${id}`);
  return res.data.contract;
}

export async function uploadContract(formData: FormData) {
  const res = await api.post<{ contract: ContractDocument }>('/contracts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.contract;
}

export async function deleteContract(id: string) {
  const res = await api.delete(`/contracts/${id}`);
  return res.data;
}

export async function triggerAnalysis(id: string) {
  const res = await api.post<{ analysis: ContractAnalysis }>(`/contracts/${id}/analyze`);
  return res.data.analysis;
}

export async function fetchAnalysis(id: string) {
  const res = await api.get<{ analysis: ContractAnalysis }>(`/contracts/${id}/analysis`);
  return res.data.analysis;
}

export async function fetchRisks(id: string) {
  const res = await api.get<{ risks: RiskFinding[] }>(`/contracts/${id}/risks`);
  return res.data.risks;
}

export async function fetchClauses(id: string) {
  const res = await api.get<{ clauses: Clause[] }>(`/contracts/${id}/clauses`);
  return res.data.clauses;
}

export async function sendChatMessage(id: string, question: string) {
  const res = await api.post<{ message: ChatMessage }>(`/contracts/${id}/chat`, { question });
  return res.data.message;
}

export async function fetchChatHistory(id: string) {
  const res = await api.get<{ history: ChatMessage[] }>(`/contracts/${id}/chat`);
  return res.data.history;
}

export async function fetchReportHtml(id: string) {
  const res = await api.get<string>(`/contracts/${id}/report`, { responseType: 'text' });
  return res.data;
}

export async function submitRiskFeedbackApi(contractId: string, riskId: string, feedback: 'correct' | 'incorrect', notes?: string) {
  const res = await api.post(`/contracts/${contractId}/risks/${riskId}/feedback`, { feedback, notes });
  return res.data;
}

export async function fetchRiskFeedbackApi(contractId: string) {
  const res = await api.get<{ feedback: any[] }>(`/contracts/${contractId}/risks/feedback`);
  return res.data.feedback;
}