"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadContract = uploadContract;
exports.listContracts = listContracts;
exports.getContract = getContract;
exports.deleteContract = deleteContract;
exports.analyzeContract = analyzeContract;
exports.getAnalysis = getAnalysis;
exports.getRisks = getRisks;
exports.getClauses = getClauses;
exports.getReport = getReport;
exports.submitRiskFeedback = submitRiskFeedback;
exports.getContractRiskFeedback = getContractRiskFeedback;
exports.getFeedbackEvaluationSummary = getFeedbackEvaluationSummary;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const repository_js_1 = require("../db/repository.js");
const documentProcessor_js_1 = require("../services/documentProcessor.js");
const orchestrator_js_1 = require("../agents/orchestrator.js");
const reportGenerator_js_1 = require("../services/reportGenerator.js");
const processor = new documentProcessor_js_1.DocumentProcessor();
const orchestrator = new orchestrator_js_1.AgentOrchestrator();
const reportGen = new reportGenerator_js_1.ReportGenerator();
async function uploadContract(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file)
            return res.status(400).json({ error: 'No contract document uploaded' });
        const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');
        const contractType = req.body.contractType || 'Master Services Agreement';
        const ext = path_1.default.extname(req.file.originalname).toLowerCase().replace('.', '');
        const repo = await (0, repository_js_1.getRepository)();
        const contract = await repo.createContract({
            userId: req.user.id,
            title,
            contractType,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: ext,
            filePath: req.file.path,
            status: 'PROCESSING',
            processingProgress: 10,
            processingStage: 'Document uploaded'
        });
        // Start background processing pipeline
        (async () => {
            try {
                await repo.updateContract(contract.id, {
                    processingProgress: 25,
                    processingStage: 'Extracting text and structure'
                });
                const processed = await processor.processFile(req.file.path, ext, contract.id);
                await repo.updateContract(contract.id, {
                    processingProgress: 50,
                    processingStage: 'Classifying clauses and semantic chunking'
                });
                const savedClauses = await repo.saveClauses(contract.id, processed.clauses);
                await repo.saveChunks(contract.id, processed.chunks);
                await repo.updateContract(contract.id, {
                    processingProgress: 75,
                    processingStage: 'Indexing vector embeddings'
                });
                await repo.updateContract(contract.id, {
                    processingProgress: 90,
                    processingStage: 'Running multi-agent risk analysis'
                });
                await orchestrator.runFullAnalysis(contract.id, processed.fullText, savedClauses);
                console.log(`✓ Contract ${contract.id} analyzed successfully.`);
            }
            catch (pipelineErr) {
                console.error(`Pipeline error on contract ${contract.id}:`, pipelineErr);
                await repo.updateContract(contract.id, {
                    status: 'FAILED',
                    processingStage: `Failed: ${pipelineErr.message}`
                });
            }
        })();
        return res.status(201).json({ contract });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function listContracts(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const repo = await (0, repository_js_1.getRepository)();
        const { search, status, riskLevel, type } = req.query;
        const contracts = await repo.listContracts(req.user.id, {
            search: search,
            status: status,
            riskLevel: riskLevel,
            type: type
        });
        return res.json({ contracts });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getContract(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const contract = await repo.getContractById(id);
        if (!contract)
            return res.status(404).json({ error: 'Contract not found' });
        return res.json({ contract });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function deleteContract(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const contract = await repo.getContractById(id);
        if (!contract)
            return res.status(404).json({ error: 'Contract not found' });
        if (fs_1.default.existsSync(contract.filePath)) {
            try {
                fs_1.default.unlinkSync(contract.filePath);
            }
            catch (e) { }
        }
        await repo.deleteContract(id);
        await repo.logAudit('CONTRACT_DELETED', 'contract', id, req.user?.id);
        return res.json({ success: true, message: 'Contract deleted' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function analyzeContract(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const contract = await repo.getContractById(id);
        if (!contract)
            return res.status(404).json({ error: 'Contract not found' });
        await repo.updateContract(id, { status: 'PROCESSING', processingProgress: 30, processingStage: 'Re-analyzing document' });
        const processed = await processor.processFile(contract.filePath, contract.fileType, contract.id);
        const savedClauses = await repo.saveClauses(contract.id, processed.clauses);
        await repo.saveChunks(contract.id, processed.chunks);
        const analysis = await orchestrator.runFullAnalysis(contract.id, processed.fullText, savedClauses);
        return res.json({ analysis });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getAnalysis(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const analysis = await repo.getAnalysisByContractId(id);
        if (!analysis)
            return res.status(404).json({ error: 'Analysis not found for this contract' });
        return res.json({ analysis });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getRisks(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const risks = await repo.getRisksByContractId(id);
        return res.json({ risks });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getClauses(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const clauses = await repo.getClausesByContractId(id);
        return res.json({ clauses });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getReport(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const contract = await repo.getContractById(id);
        if (!contract)
            return res.status(404).json({ error: 'Contract not found' });
        const analysis = await repo.getAnalysisByContractId(id);
        if (!analysis)
            return res.status(404).json({ error: 'Contract has not been analyzed yet' });
        const html = reportGen.generateHtmlReport(contract, analysis);
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function submitRiskFeedback(req, res) {
    try {
        const { id, riskId } = req.params;
        const { feedback, notes } = req.body;
        if (!feedback || !['correct', 'incorrect'].includes(feedback)) {
            return res.status(400).json({ error: 'Feedback must be either "correct" or "incorrect"' });
        }
        const repo = await (0, repository_js_1.getRepository)();
        const saved = await repo.saveRiskFeedback({
            contractId: id,
            riskId,
            userId: req.user?.id,
            feedback,
            notes
        });
        await repo.logAudit('RISK_FEEDBACK_SUBMITTED', 'risk_finding', riskId, req.user?.id, {
            contractId: id,
            feedback,
            notes
        });
        return res.json({ feedback: saved, message: 'Feedback stored successfully' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getContractRiskFeedback(req, res) {
    try {
        const { id } = req.params;
        const repo = await (0, repository_js_1.getRepository)();
        const feedback = await repo.getRiskFeedback(id);
        return res.json({ feedback });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getFeedbackEvaluationSummary(req, res) {
    try {
        const repo = await (0, repository_js_1.getRepository)();
        const summary = await repo.getFeedbackSummary();
        return res.json({ summary });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
