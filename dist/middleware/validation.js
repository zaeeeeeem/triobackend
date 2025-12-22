"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const errors_1 = require("../utils/errors");
const validate = (validations) => {
    return async (req, _res, next) => {
        try {
            await Promise.all(validations.map((validation) => validation.run(req)));
            const errors = (0, express_validator_1.validationResult)(req);
            if (errors.isEmpty()) {
                return next();
            }
            const extractedErrors = errors.array().map((err) => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg,
                value: err.type === 'field' ? err.value : undefined,
            }));
            return next(new errors_1.ValidationError('Validation failed', { errors: extractedErrors }));
        }
        catch (error) {
            return next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map