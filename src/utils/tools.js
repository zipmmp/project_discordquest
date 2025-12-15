import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import humanizeDuration from "humanize-duration";
import config from "../config/config.js";
import { ActionRowBuilder, ComponentType, SnowflakeUtil } from "discord.js";
import numeral from "numeral";
import axios from "axios";
import ini from "ini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache variables
let root = null;
let indexFolder = null;

// Core utilities
export function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

export async function tryAgain(fn, retries = 3, delayMs = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < retries && delayMs > 0) {
                await delay(delayMs);
            }
        }
    }
    
    throw lastError;
}

export function toTimestamp(dateStr, inSeconds = false, id = false) {
    const ts = new Date(dateStr).getTime();
    if (isNaN(ts)) {
        throw new Error(`Invalid date string: ${dateStr}`);
    }
    
    let time = inSeconds ? Math.floor(ts / 1000) : ts;
    
    if (id) {
        if (inSeconds) time = time * 1000;
        return SnowflakeUtil.generate({ timestamp: time }).toString();
    }
    
    return time;
}

// File utilities
export function findProjectRoot() {
    if (root) return root;
    
    let dir = __dirname;
    while (!fs.existsSync(path.join(dir, 'package.json'))) {
        const parentDir = path.dirname(dir);
        if (parentDir === dir) break;
        dir = parentDir;
    }
    
    root = dir;
    return dir;
}

export function findClosestIndexFolder() {
    if (indexFolder) return indexFolder;
    
    let dir = __dirname;
    while (true) {
        const tsPath = path.join(dir, "index.ts");
        const jsPath = path.join(dir, "index.js");
        
        if (fs.existsSync(tsPath) || fs.existsSync(jsPath)) {
            indexFolder = dir;
            return dir;
        }
        
        const parentDir = path.dirname(dir);
        if (parentDir === dir) break;
        dir = parentDir;
    }
    
    return null;
}

// Time utilities
export const delay = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const duration = (time, lang, units = ["y", "mo", "w", "d", "h", "m", "s"]) => {
    return humanizeDuration(time, {
        language: lang || config.defaultLanguage,
        round: true,
        units
    }) || "0";
};

// Discord utilities
export function formatDiscordTimestamp(timestampMs, styleOrFormat = 'R') {
    const timestampSeconds = Math.floor(timestampMs / 1000);
    const customFormats = {
        Date: (ts) => `<t:${ts}:d> <t:${ts}:t>`
    };
    
    if (customFormats[styleOrFormat]) {
        return customFormats[styleOrFormat](timestampSeconds);
    }
    
    if (['t', 'T', 'd', 'D', 'f', 'F', 'R'].includes(styleOrFormat)) {
        return `<t:${timestampSeconds}:${styleOrFormat}>`;
    }
    
    return `<t:${timestampSeconds}:R>`;
}

// String utilities
export function maskString(str, count, position = "end") {
    const mask = "*".repeat(Math.min(count, str.length));
    
    if (position === "start") {
        return mask + str.slice(count);
    } else {
        return str.slice(0, str.length - count) + mask;
    }
}

export function truncateString(str, maxLength, ellipsis = '...') {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - ellipsis.length) + ellipsis;
}

// Number utilities
export function generateRandomNumberWithDigits(digits = 4) {
    if (digits < 1) throw new Error("Digits must be at least 1");
    
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function readableBytes(bytes) {
    return numeral(bytes).format("0.0b");
}

// Array utilities
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Component utilities
export function disableComponents(components, defaultValue = null) {
    return components.map(row => {
        const newComponents = row.components.map(component => {
            component.data.disabled = true;
            
            if (component.type === ComponentType.StringSelect && defaultValue) {
                component.data.options = component.data.options.map(option => ({
                    ...option,
                    default: defaultValue.includes(option.value)
                }));
            }
            
            return component;
        });
        
        return new ActionRowBuilder().setComponents(newComponents);
    });
              }
