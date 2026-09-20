"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const legalSourcesController_js_1 = require("../controllers/legalSourcesController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.get('/', legalSourcesController_js_1.listLegalSources);
router.post('/', authMiddleware_js_1.authenticateJWT, authMiddleware_js_1.requireAdmin, legalSourcesController_js_1.addLegalSource);
exports.default = router;
