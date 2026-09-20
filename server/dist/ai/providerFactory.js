"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLLMProvider = getLLMProvider;
exports.getEmbeddingProvider = getEmbeddingProvider;
const env_js_1 = require("../config/env.js");
const demoAIProvider_js_1 = require("./demoAIProvider.js");
const openaiProvider_js_1 = require("./openaiProvider.js");
const geminiProvider_js_1 = require("./geminiProvider.js");
let llmInstance = null;
let embeddingInstance = null;
function getLLMProvider() {
    if (llmInstance)
        return llmInstance;
    if (env_js_1.config.aiProvider === 'openai' && env_js_1.config.openaiApiKey) {
        console.log('✓ [AI Provider] Using OpenAI LLM:', env_js_1.config.openaiModel);
        llmInstance = new openaiProvider_js_1.OpenAILLMProvider(env_js_1.config.openaiApiKey, env_js_1.config.openaiModel);
    }
    else if (env_js_1.config.aiProvider === 'gemini' && env_js_1.config.geminiApiKey) {
        console.log('✓ [AI Provider] Using Google Gemini LLM:', env_js_1.config.geminiModel);
        llmInstance = new geminiProvider_js_1.GeminiLLMProvider(env_js_1.config.geminiApiKey, env_js_1.config.geminiModel);
    }
    else {
        console.log('✓ [AI Provider] Using Demo AI Mode (Deterministic Rule & Grounded NLP Engine)');
        llmInstance = new demoAIProvider_js_1.DemoLLMProvider();
    }
    return llmInstance;
}
function getEmbeddingProvider() {
    if (embeddingInstance)
        return embeddingInstance;
    if (env_js_1.config.aiProvider === 'openai' && env_js_1.config.openaiApiKey) {
        embeddingInstance = new openaiProvider_js_1.OpenAIEmbeddingProvider(env_js_1.config.openaiApiKey);
    }
    else if (env_js_1.config.aiProvider === 'gemini' && env_js_1.config.geminiApiKey) {
        embeddingInstance = new geminiProvider_js_1.GeminiEmbeddingProvider(env_js_1.config.geminiApiKey);
    }
    else {
        embeddingInstance = new demoAIProvider_js_1.DemoEmbeddingProvider();
    }
    return embeddingInstance;
}
