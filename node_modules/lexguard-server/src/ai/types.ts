export interface LLMResponse {
  content: string;
  tokensUsed?: number;
  model: string;
}

export interface ILLMProvider {
  name: string;
  generateText(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
  generateStructured<T>(prompt: string, systemPrompt?: string): Promise<T>;
}

export interface IEmbeddingProvider {
  name: string;
  dimension: number;
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}
