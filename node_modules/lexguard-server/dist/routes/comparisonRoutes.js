"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comparisonController_js_1 = require("../controllers/comparisonController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authenticateJWT);
router.post('/', comparisonController_js_1.compareContracts);
exports.default = router;
