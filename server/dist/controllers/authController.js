"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getCurrentUser = getCurrentUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const repository_js_1 = require("../db/repository.js");
const env_js_1 = require("../config/env.js");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['user', 'admin']).optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
async function register(req, res) {
    try {
        const data = registerSchema.parse(req.body);
        const repo = await (0, repository_js_1.getRepository)();
        const existing = await repo.findUserByEmail(data.email);
        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(data.password, salt);
        const user = await repo.createUser({
            email: data.email,
            name: data.name,
            passwordHash,
            role: data.role || 'user'
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_js_1.config.jwtSecret, { expiresIn: '7d' });
        await repo.logAudit('USER_REGISTERED', 'user', user.id, user.id);
        return res.status(201).json({ user, token });
    }
    catch (err) {
        return res.status(400).json({ error: err.errors ? err.errors[0].message : err.message });
    }
}
async function login(req, res) {
    try {
        const data = loginSchema.parse(req.body);
        const repo = await (0, repository_js_1.getRepository)();
        const user = await repo.findUserByEmail(data.email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(data.password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_js_1.config.jwtSecret, { expiresIn: '7d' });
        const { passwordHash, ...safeUser } = user;
        await repo.logAudit('USER_LOGIN', 'user', user.id, user.id);
        return res.json({ user: safeUser, token });
    }
    catch (err) {
        return res.status(400).json({ error: err.errors ? err.errors[0].message : err.message });
    }
}
async function getCurrentUser(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Not authenticated' });
        const repo = await (0, repository_js_1.getRepository)();
        const user = await repo.findUserById(req.user.id);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        return res.json({ user });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
