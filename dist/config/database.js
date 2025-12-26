"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
    ],
});
// Log queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger_1.logger.debug(`Query: ${e.query}`);
        logger_1.logger.debug(`Duration: ${e.duration}ms`);
    });
}
exports.default = prisma;
//# sourceMappingURL=database.js.map