"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAILLMProvider = exports.OpenAIEmbeddingProvider = void 0;
class OpenAIEmbeddingProvider {
    name = 'OpenAI text-embedding-3-small';
    dimension = 1536;
    apiKey;
    model;
    constructor(apiKey, model = 'text-embedding-3-small') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generateEmbedding(text) {
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
        const data = await res.json();
        return data.data[0].embedding;
    }
    async generateBatchEmbeddings(texts) {
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
        const data = await res.json();
        return data.data.map((d) => d.embedding);
    }
}
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider;
class OpenAILLMProvider {
    name = 'OpenAI LLM Provider';
    apiKey;
    model;
    constructor(apiKey, model = 'gpt-4o-mini') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generateText(prompt, systemPrompt = 'You are LexGuard, an expert legal contract intelligence assistant.') {
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
        const data = await res.json();
        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens,
            model: this.model
        };
    }
    async generateStructured(prompt, systemPrompt) {
        const res = await this.generateText(prompt + '\n\nIMPORTANT: Respond ONLY with valid JSON conforming to the requested schema. Do not enclose in markdown ticks if possible, or use ```json.', systemPrompt);
        const cleaned = res.content.replace(/```json\s*|\s*```/g, '').trim();
        return JSON.parse(cleaned);
    }
}
exports.OpenAILLMProvider = OpenAILLMProvider;
