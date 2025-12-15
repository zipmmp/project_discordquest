import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import path from "path";
import { fileURLToPath } from "url";
import util from "util";
import chalk from "chalk";
import config from "../../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logger {
    static #logger = Logger.#createLogger();
    
    static #createLogger() {
        // Ensure logs directory exists
        const logsDir = path.join(process.cwd(), "logs");
        try {
            require("fs").mkdirSync(logsDir, { recursive: true });
        } catch (error) {
            console.error("Failed to create logs directory:", error);
        }
        
        // File transport for daily rotation
        const fileTransport = new DailyRotateFile({
            filename: path.join(logsDir, "%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        });
        
        // Console transport with colors
        const consoleTransport = new winston.transports.Console({
            format: winston.format.combine(
                winston.format((info) => {
                    info.level = info.level.toUpperCase();
                    return info;
                })(),
                winston.format.colorize(),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    let metaStr = '';
                    if (Object.keys(meta).length > 0) {
                        metaStr = ' ' + util.inspect(meta, { colors: true, depth: 2 });
                    }
                    return chalk.gray(`[${timestamp}]`) + ` ${level}: ${message}${metaStr}`;
                })
            )
        });
        
        // Create logger instance
        const logger = winston.createLogger({
            level: config.debugMode ? "debug" : "info",
            transports: [fileTransport],
            exceptionHandlers: [
                new winston.transports.File({ 
                    filename: path.join(logsDir, "exceptions.log") 
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({ 
                    filename: path.join(logsDir, "rejections.log") 
                })
            ],
            exitOnError: false
        });
        
        // Always add console transport in development
        if (process.env.NODE_ENV !== "production" || config.debugMode) {
            logger.add(consoleTransport);
        }
        
        // Add Logtail transport if enabled
        if (process.env.LOGTAIL_ENABLE === "true") {
            try {
                const token = process.env.LOGTAIL_SOURCE_TOKEN;
                const endpoint = process.env.LOGTAIL_INGESTION_HOST;
                
                if (token && endpoint) {
                    const logtail = new Logtail(token, { endpoint });
                    logger.add(new LogtailTransport(logtail, { level: "info" }));
                    console.log("✅ Logtail logging enabled");
                }
            } catch (error) {
                console.error("❌ Failed to initialize Logtail:", error);
            }
        }
        
        return logger;
    }
    
    // Public logging methods
    static info(message, ...meta) {
        this.#logger.info(message, ...meta);
    }
    
    static error(message, ...meta) {
        this.#logger.error(message, ...meta);
    }
    
    static warn(message, ...meta) {
        this.#logger.warn(message, ...meta);
    }
    
    static debug(message, ...meta) {
        this.#logger.debug(message, ...meta);
    }
    
    static log(level, message, ...meta) {
        this.#logger.log(level, message, ...meta);
    }
    
    // Utility methods
    static getLogger() {
        return this.#logger;
    }
    
    static createChildLogger(moduleName) {
        return {
            info: (msg, ...meta) => this.#logger.info(`[${moduleName}] ${msg}`, ...meta),
            error: (msg, ...meta) => this.#logger.error(`[${moduleName}] ${msg}`, ...meta),
            warn: (msg, ...meta) => this.#logger.warn(`[${moduleName}] ${msg}`, ...meta),
            debug: (msg, ...meta) => this.#logger.debug(`[${moduleName}] ${msg}`, ...meta)
        };
    }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
    Logger.error("💥 Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    Logger.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

export default Logger;
