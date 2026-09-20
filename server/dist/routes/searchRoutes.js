"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_js_1 = require("../controllers/searchController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authenticateJWT);
router.get('/', searchController_js_1.globalSearch);
exports.default = router;
