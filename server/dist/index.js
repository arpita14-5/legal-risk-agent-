"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_js_1 = require("./config/env.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const repository_js_1 = require("./db/repository.js");
const seed_js_1 = require("./db/seed.js");
async function bootstrap() {
    const app = (0, express_1.default)();
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));
    app.use(express_1.default.json({ limit: '30mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '30mb' }));
    // Static uploads directory
    app.use('/uploads', express_1.default.static(env_js_1.config.uploadDir));
    // Mount API
    app.use('/api', index_js_1.default);
    // Initialize DB & Seed Data
    try {
        await (0, repository_js_1.getRepository)();
        await (0, seed_js_1.seedInitialData)();
    }
    catch (err) {
        console.error('Database initialization error:', err);
    }
    // Error handling middleware
    app.use((err, _req, res, _next) => {
        console.error('Unhandled Server Error:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    });
    const server = app.listen(env_js_1.config.port, () => {
        console.log(`
========================================================================
   🛡️  LexGuard — AI Legal Intelligence & Contract Risk Platform
========================================================================
  • Server listening on: http://localhost:${env_js_1.config.port}
  • API Endpoint:        http://localhost:${env_js_1.config.port}/api
  • AI Provider:         ${env_js_1.config.isDemoMode ? 'Demo AI Mode (Deterministic Rule & NLP Grounded)' : env_js_1.config.aiProvider}
  • Pre-seeded Login:    counsel@lexguard.ai (pwd: password123)
  • Admin Login:         admin@lexguard.ai (pwd: password123)
========================================================================
    `);
    });
    return server;
}
bootstrap();
