"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLegalSources = listLegalSources;
exports.addLegalSource = addLegalSource;
const repository_js_1 = require("../db/repository.js");
const providerFactory_js_1 = require("../ai/providerFactory.js");
async function listLegalSources(req, res) {
    try {
        const { search, jurisdiction } = req.query;
        const repo = await (0, repository_js_1.getRepository)();
        const sources = await repo.getLegalSources(search, jurisdiction);
        return res.json({ sources });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function addLegalSource(req, res) {
    try {
        const { title, source, jurisdiction, section, url, content } = req.body;
        if (!title || !source || !jurisdiction || !content) {
            return res.status(400).json({ error: 'title, source, jurisdiction, and content are required' });
        }
        const embedder = (0, providerFactory_js_1.getEmbeddingProvider)();
        let embedding;
        try {
            embedding = await embedder.generateEmbedding(`${title} ${content}`);
        }
        catch (e) { }
        const repo = await (0, repository_js_1.getRepository)();
        const created = await repo.addLegalSource({
            title,
            source,
            jurisdiction,
            section,
            url,
            content,
            contentSnippet: content.slice(0, 300),
            embedding
        });
        await repo.logAudit('LEGAL_SOURCE_ADDED', 'legal_source', created.id, req.user?.id);
        return res.status(201).json({ source: created });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
