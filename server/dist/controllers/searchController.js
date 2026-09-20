"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = globalSearch;
const repository_js_1 = require("../db/repository.js");
async function globalSearch(req, res) {
    try {
        const q = (req.query.q || '').trim().toLowerCase();
        if (!q)
            return res.json({ contracts: [], clauses: [], risks: [], legalSources: [] });
        const repo = await (0, repository_js_1.getRepository)();
        const userId = req.user?.id || '';
        // Search user contracts
        const contracts = await repo.listContracts(userId, { search: q });
        // Search legal sources
        const legalSources = await repo.getLegalSources(q);
        return res.json({
            contracts,
            legalSources
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
