import type { ILLMProvider, IEmbeddingProvider, LLMResponse } from './types.js';

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  name = 'OpenAI text-embedding-3-small';
  dimension = 1536;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: this.model
      })
    });
    if (!res.ok) {
      throw new Error(`OpenAI Embedding API error: ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    return data.data[0].embedding;
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: this.model
      })
    });
    if (!res.ok) {
      throw new Error(`OpenAI Batch Embedding API error: ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    return data.data.map((d: any) => d.embedding);
  }
}

export class OpenAILLMProvider implements ILLMProvider {
  name = 'OpenAI LLM Provider';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt: string, systemPrompt = 'You are LexGuard, an expert legal contract intelligence assistant.'): Promise<LLMResponse> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      })
    });

    if (!res.ok) {
      throw new Error(`OpenAI Chat API error: ${res.status} ${res.statusText}`);
    }
    const data: any = await res.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens,
      model: this.model
    };
  }

  async generateStructured<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const res = await this.generateText(prompt + '\n\nIMPORTANT: Respond ONLY with valid JSON conforming to the requested schema. Do not enclose in markdown ticks if possible, or use ```json.', systemPrompt);
    const cleaned = res.content.replace(/```json\s*|\s*```/g, '').trim();
    return JSON.parse(cleaned) as T;
  }
}
