"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const auth_validator_1 = require("../validators/auth.validator");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.post('/register', auth_validator_1.registerValidator, validate_1.validate, auth_controller_1.register);
router.post('/login', auth_validator_1.loginValidator, validate_1.validate, auth_controller_1.login);
router.get('/me', auth_1.authenticate, auth_controller_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map