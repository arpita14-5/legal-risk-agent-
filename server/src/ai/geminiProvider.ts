import type { ILLMProvider, IEmbeddingProvider, LLMResponse } from './types.js';

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  name = 'Google Gemini text-embedding-004';
  dimension = 768;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'text-embedding-004') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] }
      })
    });
    if (!res.ok) {
      throw new Error(`Gemini Embedding API error: ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    return data.embedding.values;
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }
}

export class GeminiLLMProvider implements ILLMProvider {
  name = 'Google Gemini Provider';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt: string, systemPrompt = 'You are LexGuard, an expert legal contract intelligence assistant.'): Promise<LLMResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    });
    if (!res.ok) {
      throw new Error(`Gemini Chat API error: ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      content: candidate,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      model: this.model
    };
  }

  async generateStructured<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const res = await this.generateText(prompt + '\n\nRespond with strictly valid JSON only.', systemPrompt);
    const cleaned = res.content.replace(/```json\s*|\s*```/g, '').trim();
    return JSON.parse(cleaned) as T;
  }
}
