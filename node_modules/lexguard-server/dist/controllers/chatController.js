"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatMessage = sendChatMessage;
exports.getChatHistory = getChatHistory;
const orchestrator_js_1 = require("../agents/orchestrator.js");
const repository_js_1 = require("../db/repository.js");
const orchestrator = new orchestrator_js_1.AgentOrchestrator();
async function sendChatMessage(req, res) {
    try {
        const { id } = req.params;
        const { question } = req.body;
        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: 'Question string is required' });
        }
        const repo = await (0, repository_js_1.getRepository)();
        // Save user's message in chat history
        await repo.saveChatMessage(id, {
            role: 'user',
            content: question
        });
        // Run grounded RAG answering and claim verification
        const reply = await orchestrator.answerContractQuestion(id, question);
        return res.json({ message: reply });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getChatHistory(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const history = await repo.getChatHistory(id);
        return res.json({ history });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
