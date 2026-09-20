"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObservabilityStats = getObservabilityStats;
exports.listUsers = listUsers;
const repository_js_1 = require("../db/repository.js");
async function getObservabilityStats(req, res) {
    try {
        const repo = await (0, repository_js_1.getRepository)();
        const metrics = await repo.getObservabilityMetrics();
        const logs = await repo.getAuditLogs(30);
        const users = await repo.getAllUsers();
        return res.json({
            metrics,
            logs,
            totalUsers: users.length
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function listUsers(req, res) {
    try {
        const repo = await (0, repository_js_1.getRepository)();
        const users = await repo.getAllUsers();
        return res.json({ users });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
