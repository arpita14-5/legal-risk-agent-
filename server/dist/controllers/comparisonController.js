"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareContracts = compareContracts;
const orchestrator_js_1 = require("../agents/orchestrator.js");
const orchestrator = new orchestrator_js_1.AgentOrchestrator();
async function compareContracts(req, res) {
    try {
        const { contractIdA, contractIdB } = req.body;
        if (!contractIdA || !contractIdB) {
            return res.status(400).json({ error: 'contractIdA and contractIdB are both required' });
        }
        const comparison = await orchestrator.compareContracts(contractIdA, contractIdB);
        return res.json({ comparison });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
