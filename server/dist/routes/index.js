"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const contractRoutes_js_1 = __importDefault(require("./contractRoutes.js"));
const comparisonRoutes_js_1 = __importDefault(require("./comparisonRoutes.js"));
const legalSourcesRoutes_js_1 = __importDefault(require("./legalSourcesRoutes.js"));
const searchRoutes_js_1 = __importDefault(require("./searchRoutes.js"));
const adminRoutes_js_1 = __importDefault(require("./adminRoutes.js"));
const contractController_js_1 = require("../controllers/contractController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const apiRouter = (0, express_1.Router)();
apiRouter.use('/auth', authRoutes_js_1.default);
apiRouter.use('/contracts', contractRoutes_js_1.default);
apiRouter.use('/contracts/compare', comparisonRoutes_js_1.default);
apiRouter.use('/compare', comparisonRoutes_js_1.default);
apiRouter.use('/legal-sources', legalSourcesRoutes_js_1.default);
apiRouter.use('/search', searchRoutes_js_1.default);
apiRouter.use('/admin', adminRoutes_js_1.default);
apiRouter.get('/evaluation/feedback-summary', authMiddleware_js_1.authenticateJWT, contractController_js_1.getFeedbackEvaluationSummary);
apiRouter.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'LexGuard Legal Intelligence' });
});
exports.default = apiRouter;
