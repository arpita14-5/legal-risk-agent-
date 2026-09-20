"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchAgent = void 0;
const repository_js_1 = require("../db/repository.js");
class ResearchAgent {
    name = 'Legal Research Agent';
    async findRelevantLegalAuthorities(topics) {
        const repo = await (0, repository_js_1.getRepository)();
        const results = [];
        const seen = new Set();
        for (const topic of topics) {
            const sources = await repo.searchLegalSources(topic, undefined, 2);
            for (const s of sources) {
                if (!seen.has(s.id)) {
                    seen.add(s.id);
                    results.push(s);
                }
            }
        }
        return results;
    }
}
exports.ResearchAgent = ResearchAgent;
