"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiLLMProvider = exports.GeminiEmbeddingProvider = void 0;
class GeminiEmbeddingProvider {
    name = 'Google Gemini text-embedding-004';
    dimension = 768;
    apiKey;
    model;
    constructor(apiKey, model = 'text-embedding-004') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generateEmbedding(text) {
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
        const data = await res.json();
        return data.embedding.values;
    }
    async generateBatchEmbeddings(texts) {
        return Promise.all(texts.map(t => this.generateEmbedding(t)));
    }
}
exports.GeminiEmbeddingProvider = GeminiEmbeddingProvider;
class GeminiLLMProvider {
    name = 'Google Gemini Provider';
    apiKey;
    model;
    constructor(apiKey, model = 'gemini-1.5-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generateText(prompt, systemPrompt = 'You are LexGuard, an expert legal contract intelligence assistant.') {
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
        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
            content: candidate,
            tokensUsed: data.usageMetadata?.totalTokenCount || 0,
            model: this.model
        };
    }
    async generateStructured(prompt, systemPrompt) {
        const res = await this.generateText(prompt + '\n\nRespond with strictly valid JSON only.', systemPrompt);
        const cleaned = res.content.replace(/```json\s*|\s*```/g, '').trim();
        return JSON.parse(cleaned);
    }
}
exports.GeminiLLMProvider = GeminiLLMProvider;
