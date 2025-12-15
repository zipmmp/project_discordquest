import fs from 'fs';
import path from 'path';

export class I18nManager {
    #translations = {};
    #defaultLang;
    #cache = new Map();
    
    constructor(defaultLang = 'en') {
        this.#defaultLang = defaultLang;
        this.#loadTranslations();
    }
    
    #loadTranslations() {
        const langDir = path.join(process.cwd(), 'lang');
        
        if (!fs.existsSync(langDir)) {
            console.warn(`⚠️ Language directory not found: ${langDir}`);
            this.#createDefaultTranslations(langDir);
            return;
        }
        
        const files = fs.readdirSync(langDir).filter(file => file.endsWith('.json'));
        
        if (files.length === 0) {
            console.warn(`⚠️ No language files found in ${langDir}`);
            this.#createDefaultTranslations(langDir);
            return;
        }
        
        for (const file of files) {
            const lang = file.replace('.json', '');
            const filePath = path.join(langDir, file);
            
            try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.#translations[lang] = content;
                console.log(`✅ Loaded language: ${lang}`);
            } catch (error) {
                console.error(`❌ Error loading language file ${file}:`, error);
            }
        }
    }
    
    #createDefaultTranslations(langDir) {
        if (!fs.existsSync(langDir)) {
            fs.mkdirSync(langDir, { recursive: true });
        }
        
        const defaultTranslations = {
            en: {
                langConfig: {
                    name: "English",
                    flag: "🇺🇸",
                    short: "en"
                },
                commands: {
                    ping: {
                        description: "Check bot latency",
                        response: "Pong! 🏓 Latency: {ms}ms"
                    },
                    help: {
                        description: "Show list of commands",
                        response: "Available commands:\n{commands}"
                    }
                },
                errors: {
                    permission: "You don't have permission to use this command!",
                    cooldown: "Please wait {time} before using this command again.",
                    commandDisabled: "This command is currently disabled.",
                    guildOnly: "This command can only be used in servers.",
                    dmOnly: "This command can only be used in DMs.",
                    notAllowedGuild: "This command is not allowed in this server.",
                    developerOnly: "This command is for developers only.",
                    ownerOnly: "This command is for server owners only.",
                    noPermissionBot: "I need the following permissions: {permissions}",
                    noPermmisionUser: "You need {permissions} to use this command.",
                    commandError: "An error occurred while executing the command.",
                    commandDisabledInChannel: "This command is disabled in this channel.",
                    commandDisabledInRole: "This command is disabled for your role."
                },
                message: {
                    gameName: "Game",
                    publisher: "Publisher",
                    questName: "Quest",
                    enrolledAt: "Enrolled At",
                    expiresAt: "Expires At",
                    startsAT: "Starts At",
                    progress: "Progress",
                    rewards: "Rewards",
                    tasks: "Tasks",
                    newQuest: "🎉 New Quest Available!",
                    noExpires: "Does not expire"
                },
                buttons: {
                    completed: "Completed",
                    notsupported: "Not Supported",
                    stop: "Stop",
                    start: "Start",
                    enroll: "Enroll"
                },
                badge: {
                    selectPlaceholder: "Select a quest...",
                    logs: "Quest Logs",
                    pleaseChangeYourPassword: "Please change your password for security",
                    ViewQuest: "View Quest"
                },
                events: {
                    PLAY_ACTIVITY: "Play Activity",
                    PLAY_ON_DESKTOP: "Play on Desktop",
                    WATCH_VIDEO: "Watch Video",
                    WATCH_VIDEO_ON_MOBILE: "Watch on Mobile"
                },
                for: "for",
                months: "months"
            }
        };
        
        for (const [lang, translations] of Object.entries(defaultTranslations)) {
            const filePath = path.join(langDir, `${lang}.json`);
            fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf-8');
            this.#translations[lang] = translations;
        }
        
        console.log(`✅ Created default language files in ${langDir}`);
    }
    
    t(lang, key, variables = {}) {
        const value = this.#getNestedValue(this.#translations[lang], key) ||
                     this.#getNestedValue(this.#translations[this.#defaultLang], key) ||
                     key;
        
        if (typeof value !== 'string') return key;
        
        // Replace variables like {variable}
        return value.replace(/\{(\w+)\}/g, (_, varName) => {
            return String(variables[varName] ?? `{${varName}}`);
        });
    }
    
    tDefault(key, variables = {}) {
        return this.t(this.#defaultLang, key, variables);
    }
    
    #getNestedValue(obj, key) {
        if (!obj || !key) return null;
        return key.split('.').reduce((acc, part) => acc?.[part], obj);
    }
    
    getAvailableLanguages() {
        return Object.entries(this.#translations).map(([lang, data]) => ({
            lang,
            name: data?.langConfig?.name ?? lang,
            flag: data?.langConfig?.flag ?? '',
            short: data?.langConfig?.short ?? lang
        }));
    }
    
    get(lang) {
        if (!this.#cache.has(lang)) {
            this.#cache.set(lang, new I18nInstance(lang, this));
        }
        return this.#cache.get(lang);
    }
}

export class I18nInstance {
    #lang;
    #manager;
    
    constructor(lang, manager) {
        this.#lang = lang;
        this.#manager = manager;
    }
    
    t(key, variables = {}) {
        return this.#manager.t(this.#lang, key, variables);
    }
    
    getLang() {
        return this.#lang;
    }
}

// Create default instance
export const i18n = new I18nManager(process.env.DEFAULT_LANGUAGE || 'en');
export default i18n;
