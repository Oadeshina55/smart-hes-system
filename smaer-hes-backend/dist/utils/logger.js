"use strict";
/**
 * Logger utility for HES system
 * Provides consistent logging across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["INFO"] = "INFO";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }
    error(message, meta) {
        console.error(this.formatMessage(LogLevel.ERROR, message, meta));
    }
    warn(message, meta) {
        console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
    info(message, meta) {
        console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }
    debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }
}
const logger = new Logger();
exports.default = logger;
//# sourceMappingURL=logger.js.map