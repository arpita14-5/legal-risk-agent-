import { config } from '../config/env.js';
import type { ILLMProvider, IEmbeddingProvider } from './types.js';
import { DemoLLMProvider, DemoEmbeddingProvider } from './demoAIProvider.js';
import { OpenAILLMProvider, OpenAIEmbeddingProvider } from './openaiProvider.js';
import { GeminiLLMProvider, GeminiEmbeddingProvider } from './geminiProvider.js';

let llmInstance: ILLMProvider | null = null;
let embeddingInstance: IEmbeddingProvider | null = null;

export function getLLMProvider(): ILLMProvider {
  if (llmInstance) return llmInstance;

  if (config.aiProvider === 'openai' && config.openaiApiKey) {
    console.log('✓ [AI Provider] Using OpenAI LLM:', config.openaiModel);
    llmInstance = new OpenAILLMProvider(config.openaiApiKey, config.openaiModel);
  } else if (config.aiProvider === 'gemini' && config.geminiApiKey) {
    console.log('✓ [AI Provider] Using Google Gemini LLM:', config.geminiModel);
    llmInstance = new GeminiLLMProvider(config.geminiApiKey, config.geminiModel);
  } else {
    console.log('✓ [AI Provider] Using Demo AI Mode (Deterministic Rule & Grounded NLP Engine)');
    llmInstance = new DemoLLMProvider();
  }

  return llmInstance;
}

export function getEmbeddingProvider(): IEmbeddingProvider {
  if (embeddingInstance) return embeddingInstance;

  if (config.aiProvider === 'openai' && config.openaiApiKey) {
    embeddingInstance = new OpenAIEmbeddingProvider(config.openaiApiKey);
  } else if (config.aiProvider === 'gemini' && config.geminiApiKey) {
    embeddingInstance = new GeminiEmbeddingProvider(config.geminiApiKey);
  } else {
    embeddingInstance = new DemoEmbeddingProvider();
  }

  return embeddingInstance;
}
