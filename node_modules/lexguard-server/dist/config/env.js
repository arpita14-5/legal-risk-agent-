"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'lexguard_academic_secret_jwt_key_2025',
    jwtExpiresIn: '7d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL || '',
    aiProvider: (process.env.AI_PROVIDER || 'demo').toLowerCase(),
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.LLM_MODEL || 'gpt-4o-mini',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    uploadDir: path_1.default.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
    isDemoMode: !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY
};
