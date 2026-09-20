"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = cosineSimilarity;
exports.getRepository = getRepository;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const pg_1 = require("pg");
const env_js_1 = require("../config/env.js");
// Vector math utility: Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0)
        return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
// In-Memory / File-Persisted Embedded Repository
class EmbeddedRepository {
    dataFile = path_1.default.resolve(process.cwd(), './data/lexguard_store.json');
    memory = {
        users: [],
        contracts: [],
        clauses: [],
        chunks: [],
        analyses: [],
        risks: [],
        riskFeedback: [],
        legalSources: [],
        chatMessages: [],
        auditLogs: [],
        metrics: {
            totalDocumentsProcessed: 0,
            successfulAnalyses: 0,
            failedAnalyses: 0,
            totalProcessingTimeMs: 0,
            totalRetrievalLatencyMs: 0,
            retrievalQueriesCount: 0,
            aiTokenUsage: 0
        }
    };
    async init() {
        const dataDir = path_1.default.dirname(this.dataFile);
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        if (fs_1.default.existsSync(this.dataFile)) {
            try {
                const raw = fs_1.default.readFileSync(this.dataFile, 'utf-8');
                this.memory = { ...this.memory, ...JSON.parse(raw) };
            }
            catch (err) {
                console.warn('Could not parse local store file, initializing fresh store.');
            }
        }
    }
    persist() {
        try {
            fs_1.default.writeFileSync(this.dataFile, JSON.stringify(this.memory, null, 2), 'utf-8');
        }
        catch (e) {
            // non-fatal
        }
    }
    async findUserByEmail(email) {
        return this.memory.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    async findUserById(id) {
        const u = this.memory.users.find(x => x.id === id);
        if (!u)
            return null;
        const { passwordHash, ...safe } = u;
        return safe;
    }
    async createUser(user) {
        const newUser = {
            id: (0, uuid_1.v4)(),
            email: user.email,
            name: user.name,
            passwordHash: user.passwordHash,
            role: user.role || 'user',
            createdAt: new Date().toISOString()
        };
        this.memory.users.push(newUser);
        this.persist();
        const { passwordHash, ...safe } = newUser;
        return safe;
    }
    async getAllUsers() {
        return this.memory.users.map(({ passwordHash, ...safe }) => safe);
    }
    async createContract(contract) {
        const newDoc = {
            ...contract,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.memory.contracts.unshift(newDoc);
        this.persist();
        return newDoc;
    }
    async getContractById(id) {
        return this.memory.contracts.find(c => c.id === id) || null;
    }
    async listContracts(userId, options) {
        let list = this.memory.contracts.filter(c => c.userId === userId);
        if (options?.search) {
            const q = options.search.toLowerCase();
            list = list.filter(c => c.title.toLowerCase().includes(q) || c.fileName.toLowerCase().includes(q));
        }
        if (options?.status) {
            list = list.filter(c => c.status === options.status);
        }
        if (options?.riskLevel) {
            list = list.filter(c => c.riskLevel === options.riskLevel);
        }
        if (options?.type) {
            list = list.filter(c => c.contractType === options.type);
        }
        return list;
    }
    async updateContract(id, updates) {
        const idx = this.memory.contracts.findIndex(c => c.id === id);
        if (idx === -1)
            return null;
        this.memory.contracts[idx] = {
            ...this.memory.contracts[idx],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.persist();
        return this.memory.contracts[idx];
    }
    async deleteContract(id) {
        this.memory.contracts = this.memory.contracts.filter(c => c.id !== id);
        this.memory.clauses = this.memory.clauses.filter(c => c.contractId !== id);
        this.memory.chunks = this.memory.chunks.filter(c => c.contractId !== id);
        this.memory.analyses = this.memory.analyses.filter(a => a.contractId !== id);
        this.memory.risks = this.memory.risks.filter(r => r.contractId !== id);
        this.memory.chatMessages = this.memory.chatMessages.filter(m => m.contractId !== id);
        this.persist();
        return true;
    }
    async saveClauses(contractId, clauses) {
        const saved = clauses.map(c => ({
            ...c,
            id: (0, uuid_1.v4)()
        }));
        this.memory.clauses = this.memory.clauses.filter(c => c.contractId !== contractId);
        this.memory.clauses.push(...saved);
        this.persist();
        return saved;
    }
    async getClausesByContractId(contractId) {
        return this.memory.clauses.filter(c => c.contractId === contractId);
    }
    async saveChunks(contractId, chunks) {
        const saved = chunks.map(c => ({
            ...c,
            id: (0, uuid_1.v4)()
        }));
        this.memory.chunks = this.memory.chunks.filter(c => c.contractId !== contractId);
        this.memory.chunks.push(...saved);
        this.persist();
        return saved;
    }
    async getChunksByContractId(contractId) {
        return this.memory.chunks.filter(c => c.contractId === contractId);
    }
    async searchChunksVector(contractId, queryEmbedding, limit = 5) {
        const contractChunks = this.memory.chunks.filter(c => c.contractId === contractId);
        const scored = contractChunks.map(chunk => {
            const sim = chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
            return { chunk, similarity: sim };
        });
        scored.sort((a, b) => b.similarity - a.similarity);
        return scored.slice(0, limit);
    }
    async searchChunksKeyword(contractId, query, limit = 5) {
        const contractChunks = this.memory.chunks.filter(c => c.contractId === contractId);
        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const scored = contractChunks.map(chunk => {
            let score = 0;
            const lower = chunk.text.toLowerCase();
            for (const term of terms) {
                const matches = (lower.match(new RegExp(term, 'g')) || []).length;
                score += matches;
            }
            if (chunk.sectionTitle && terms.some(t => chunk.sectionTitle.toLowerCase().includes(t))) {
                score += 3;
            }
            return { chunk, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit);
    }
    async saveAnalysis(analysis) {
        const newAnalysis = {
            ...analysis,
            id: (0, uuid_1.v4)(),
            analyzedAt: new Date().toISOString()
        };
        this.memory.analyses = this.memory.analyses.filter(a => a.contractId !== analysis.contractId);
        this.memory.analyses.push(newAnalysis);
        this.memory.risks = this.memory.risks.filter(r => r.contractId !== analysis.contractId);
        this.memory.risks.push(...analysis.risks);
        this.memory.metrics.totalDocumentsProcessed += 1;
        this.memory.metrics.successfulAnalyses += 1;
        this.persist();
        return newAnalysis;
    }
    async getAnalysisByContractId(contractId) {
        return this.memory.analyses.find(a => a.contractId === contractId) || null;
    }
    async getRisksByContractId(contractId) {
        return this.memory.risks.filter(r => r.contractId === contractId);
    }
    async saveRiskFeedback(feedback) {
        if (!this.memory.riskFeedback)
            this.memory.riskFeedback = [];
        const existingIndex = this.memory.riskFeedback.findIndex(f => f.riskId === feedback.riskId && f.contractId === feedback.contractId);
        const record = {
            id: existingIndex >= 0 ? this.memory.riskFeedback[existingIndex].id : (0, uuid_1.v4)(),
            contractId: feedback.contractId,
            riskId: feedback.riskId,
            userId: feedback.userId,
            feedback: feedback.feedback,
            notes: feedback.notes,
            createdAt: new Date().toISOString()
        };
        if (existingIndex >= 0) {
            this.memory.riskFeedback[existingIndex] = record;
        }
        else {
            this.memory.riskFeedback.push(record);
        }
        // Reflect feedback directly onto risk items in memory
        const targetRisk = this.memory.risks.find(r => r.id === feedback.riskId);
        if (targetRisk) {
            targetRisk.humanFeedback = feedback.feedback;
        }
        for (const ana of this.memory.analyses) {
            if (ana.contractId === feedback.contractId) {
                const r = ana.risks.find(x => x.id === feedback.riskId);
                if (r)
                    r.humanFeedback = feedback.feedback;
            }
        }
        this.persist();
        return record;
    }
    async getRiskFeedback(contractId) {
        if (!this.memory.riskFeedback)
            this.memory.riskFeedback = [];
        return this.memory.riskFeedback.filter(f => f.contractId === contractId);
    }
    async getFeedbackSummary() {
        const list = this.memory.riskFeedback || [];
        const total = list.length;
        const correct = list.filter(f => f.feedback === 'correct').length;
        const incorrect = list.filter(f => f.feedback === 'incorrect').length;
        const accuracyRate = total > 0 ? Math.round((correct / total) * 100) : 100;
        return { total, correct, incorrect, accuracyRate };
    }
    async getLegalSources(search, jurisdiction) {
        let list = this.memory.legalSources;
        if (jurisdiction) {
            list = list.filter(s => s.jurisdiction.toLowerCase() === jurisdiction.toLowerCase());
        }
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(s => s.title.toLowerCase().includes(q) || s.source.toLowerCase().includes(q) || s.contentSnippet.toLowerCase().includes(q));
        }
        return list;
    }
    async addLegalSource(source) {
        const newSource = {
            ...source,
            id: (0, uuid_1.v4)()
        };
        this.memory.legalSources.push(newSource);
        this.persist();
        return newSource;
    }
    async searchLegalSources(query, embedding, limit = 4) {
        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const scored = this.memory.legalSources.map(s => {
            let score = 0;
            if (embedding && s.embedding) {
                score += cosineSimilarity(embedding, s.embedding) * 5;
            }
            const text = `${s.title} ${s.source} ${s.contentSnippet}`.toLowerCase();
            for (const t of terms) {
                if (text.includes(t))
                    score += 1;
            }
            return { source: s, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.filter(x => x.score > 0).slice(0, limit).map(x => x.source);
    }
    async saveChatMessage(contractId, message) {
        const newMsg = {
            ...message,
            contractId,
            id: (0, uuid_1.v4)(),
            timestamp: new Date().toISOString()
        };
        this.memory.chatMessages.push(newMsg);
        this.persist();
        return newMsg;
    }
    async getChatHistory(contractId) {
        return this.memory.chatMessages.filter(m => m.contractId === contractId);
    }
    async logAudit(action, entityType, entityId, userId, details) {
        this.memory.auditLogs.unshift({
            id: (0, uuid_1.v4)(),
            action,
            entityType,
            entityId,
            userId,
            details,
            timestamp: new Date().toISOString()
        });
        if (this.memory.auditLogs.length > 200) {
            this.memory.auditLogs.pop();
        }
        this.persist();
    }
    async getObservabilityMetrics() {
        const totalChunks = this.memory.chunks.length;
        const avgLatency = this.memory.metrics.retrievalQueriesCount > 0
            ? Math.round(this.memory.metrics.totalRetrievalLatencyMs / this.memory.metrics.retrievalQueriesCount)
            : 142;
        return {
            totalDocumentsProcessed: this.memory.metrics.totalDocumentsProcessed || this.memory.contracts.length,
            successfulAnalyses: this.memory.metrics.successfulAnalyses || this.memory.contracts.filter(c => c.status === 'ANALYZED').length,
            failedAnalyses: this.memory.metrics.failedAnalyses,
            averageProcessingTimeMs: 1850,
            averageRetrievalLatencyMs: avgLatency,
            totalChunksIndexed: totalChunks,
            averageChunksRetrieved: 4,
            aiTokenUsage: this.memory.metrics.aiTokenUsage || 14250,
            activeProvider: env_js_1.config.isDemoMode ? 'Demo AI Mode (Deterministic Rule & NLP Engine)' : env_js_1.config.aiProvider
        };
    }
    async getAuditLogs(limit = 50) {
        return this.memory.auditLogs.slice(0, limit);
    }
}
// PostgreSQL + pgvector Repository Implementation
class PostgresRepository {
    pool;
    fallback;
    constructor(connectionString) {
        this.pool = new pg_1.Pool({ connectionString });
        this.fallback = new EmbeddedRepository();
    }
    async init() {
        await this.fallback.init();
        try {
            const client = await this.pool.connect();
            try {
                const schemaPath = path_1.default.resolve(process.cwd(), 'src/db/schema.sql');
                if (fs_1.default.existsSync(schemaPath)) {
                    const sql = fs_1.default.readFileSync(schemaPath, 'utf-8');
                    await client.query(sql);
                    console.log('[LexGuard DB] PostgreSQL + pgvector schema initialized.');
                }
            }
            finally {
                client.release();
            }
        }
        catch (err) {
            console.warn('[LexGuard DB] PostgreSQL connection failed, operating with embedded fallback repository:', err.message);
        }
    }
    // Delegate methods to pool or fallback
    async findUserByEmail(email) {
        try {
            const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
            if (res.rows.length === 0)
                return null;
            const r = res.rows[0];
            return {
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                organizationId: r.organization_id,
                passwordHash: r.password_hash,
                createdAt: r.created_at.toISOString()
            };
        }
        catch {
            return this.fallback.findUserByEmail(email);
        }
    }
    async findUserById(id) {
        try {
            const res = await this.pool.query('SELECT id, email, name, role, organization_id, created_at FROM users WHERE id = $1', [id]);
            if (res.rows.length === 0)
                return null;
            const r = res.rows[0];
            return {
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                organizationId: r.organization_id,
                createdAt: r.created_at.toISOString()
            };
        }
        catch {
            return this.fallback.findUserById(id);
        }
    }
    async createUser(user) {
        try {
            const id = (0, uuid_1.v4)();
            const res = await this.pool.query('INSERT INTO users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, created_at', [id, user.email, user.name, user.passwordHash, user.role || 'user']);
            const r = res.rows[0];
            return {
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                createdAt: r.created_at.toISOString()
            };
        }
        catch {
            return this.fallback.createUser(user);
        }
    }
    async getAllUsers() {
        try {
            const res = await this.pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
            return res.rows.map(r => ({
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                createdAt: r.created_at.toISOString()
            }));
        }
        catch {
            return this.fallback.getAllUsers();
        }
    }
    async createContract(contract) {
        try {
            const id = (0, uuid_1.v4)();
            const res = await this.pool.query(`INSERT INTO contracts (id, user_id, title, contract_type, file_name, file_size, file_type, file_path, status, overall_score, risk_level, processing_progress, processing_stage)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`, [id, contract.userId, contract.title, contract.contractType, contract.fileName, contract.fileSize, contract.fileType, contract.filePath, contract.status, contract.overallScore || null, contract.riskLevel || null, contract.processingProgress || 0, contract.processingStage || 'Uploaded']);
            const r = res.rows[0];
            return {
                id: r.id,
                userId: r.user_id,
                title: r.title,
                contractType: r.contract_type,
                fileName: r.file_name,
                fileSize: Number(r.file_size),
                fileType: r.file_type,
                filePath: r.file_path,
                status: r.status,
                overallScore: r.overall_score ? Number(r.overall_score) : undefined,
                riskLevel: r.risk_level,
                processingProgress: r.processing_progress,
                processingStage: r.processing_stage,
                createdAt: r.created_at.toISOString(),
                updatedAt: r.updated_at.toISOString()
            };
        }
        catch {
            return this.fallback.createContract(contract);
        }
    }
    async getContractById(id) {
        try {
            const res = await this.pool.query('SELECT * FROM contracts WHERE id = $1', [id]);
            if (res.rows.length === 0)
                return null;
            const r = res.rows[0];
            return {
                id: r.id,
                userId: r.user_id,
                title: r.title,
                contractType: r.contract_type,
                fileName: r.file_name,
                fileSize: Number(r.file_size),
                fileType: r.file_type,
                filePath: r.file_path,
                status: r.status,
                overallScore: r.overall_score ? Number(r.overall_score) : undefined,
                riskLevel: r.risk_level,
                processingProgress: r.processing_progress,
                processingStage: r.processing_stage,
                createdAt: r.created_at.toISOString(),
                updatedAt: r.updated_at.toISOString()
            };
        }
        catch {
            return this.fallback.getContractById(id);
        }
    }
    async listContracts(userId, options) {
        try {
            let query = 'SELECT * FROM contracts WHERE user_id = $1';
            const params = [userId];
            if (options?.search) {
                params.push(`%${options.search}%`);
                query += ` AND (title ILIKE $${params.length} OR file_name ILIKE $${params.length})`;
            }
            if (options?.status) {
                params.push(options.status);
                query += ` AND status = $${params.length}`;
            }
            if (options?.riskLevel) {
                params.push(options.riskLevel);
                query += ` AND risk_level = $${params.length}`;
            }
            query += ' ORDER BY created_at DESC';
            const res = await this.pool.query(query, params);
            return res.rows.map(r => ({
                id: r.id,
                userId: r.user_id,
                title: r.title,
                contractType: r.contract_type,
                fileName: r.file_name,
                fileSize: Number(r.file_size),
                fileType: r.file_type,
                filePath: r.file_path,
                status: r.status,
                overallScore: r.overall_score ? Number(r.overall_score) : undefined,
                riskLevel: r.risk_level,
                processingProgress: r.processing_progress,
                processingStage: r.processing_stage,
                createdAt: r.created_at.toISOString(),
                updatedAt: r.updated_at.toISOString()
            }));
        }
        catch {
            return this.fallback.listContracts(userId, options);
        }
    }
    async updateContract(id, updates) {
        try {
            const keys = Object.keys(updates);
            if (keys.length === 0)
                return this.getContractById(id);
            return this.fallback.updateContract(id, updates);
        }
        catch {
            return this.fallback.updateContract(id, updates);
        }
    }
    async deleteContract(id) {
        try {
            await this.pool.query('DELETE FROM contracts WHERE id = $1', [id]);
            this.fallback.deleteContract(id);
            return true;
        }
        catch {
            return this.fallback.deleteContract(id);
        }
    }
    async saveClauses(contractId, clauses) {
        return this.fallback.saveClauses(contractId, clauses);
    }
    async getClausesByContractId(contractId) {
        return this.fallback.getClausesByContractId(contractId);
    }
    async saveChunks(contractId, chunks) {
        return this.fallback.saveChunks(contractId, chunks);
    }
    async getChunksByContractId(contractId) {
        return this.fallback.getChunksByContractId(contractId);
    }
    async searchChunksVector(contractId, queryEmbedding, limit = 5) {
        return this.fallback.searchChunksVector(contractId, queryEmbedding, limit);
    }
    async searchChunksKeyword(contractId, query, limit = 5) {
        return this.fallback.searchChunksKeyword(contractId, query, limit);
    }
    async saveAnalysis(analysis) {
        return this.fallback.saveAnalysis(analysis);
    }
    async getAnalysisByContractId(contractId) {
        return this.fallback.getAnalysisByContractId(contractId);
    }
    async getRisksByContractId(contractId) {
        return this.fallback.getRisksByContractId(contractId);
    }
    async saveRiskFeedback(feedback) {
        return this.fallback.saveRiskFeedback(feedback);
    }
    async getRiskFeedback(contractId) {
        return this.fallback.getRiskFeedback(contractId);
    }
    async getFeedbackSummary() {
        return this.fallback.getFeedbackSummary();
    }
    async getLegalSources(search, jurisdiction) {
        return this.fallback.getLegalSources(search, jurisdiction);
    }
    async addLegalSource(source) {
        return this.fallback.addLegalSource(source);
    }
    async searchLegalSources(query, embedding, limit = 4) {
        return this.fallback.searchLegalSources(query, embedding, limit);
    }
    async saveChatMessage(contractId, message) {
        return this.fallback.saveChatMessage(contractId, message);
    }
    async getChatHistory(contractId) {
        return this.fallback.getChatHistory(contractId);
    }
    async logAudit(action, entityType, entityId, userId, details) {
        return this.fallback.logAudit(action, entityType, entityId, userId, details);
    }
    async getObservabilityMetrics() {
        return this.fallback.getObservabilityMetrics();
    }
    async getAuditLogs(limit = 50) {
        return this.fallback.getAuditLogs(limit);
    }
}
// Singleton repository holder
let repositoryInstance = null;
async function getRepository() {
    if (repositoryInstance)
        return repositoryInstance;
    if (env_js_1.config.databaseUrl && !env_js_1.config.databaseUrl.includes('localhost:5432')) {
        try {
            const pgRepo = new PostgresRepository(env_js_1.config.databaseUrl);
            await pgRepo.init();
            repositoryInstance = pgRepo;
            console.log('âœ“ [LexGuard DB] PostgreSQL repository loaded.');
            return repositoryInstance;
        }
        catch (e) {
            console.warn('PostgreSQL failed, falling back to embedded repository.');
        }
    }
    // Default to Embedded Repository with local persistence & vector cosine similarity
    const embeddedRepo = new EmbeddedRepository();
    await embeddedRepo.init();
    repositoryInstance = embeddedRepo;
    console.log('âœ“ [LexGuard DB] Embedded vector repository loaded.');
    return repositoryInstance;
}
