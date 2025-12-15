Enterimport { Client, Collection, ActivityType, parseEmoji, SnowflakeUtil } from "discord.js";
import { Logger } from "../lib/logger/Logger.js";
import { I18nManager } from "../lib/i18n/I18nManager.js";
import config from "../config/config.js";
import ms from "ms";
import path from "path";
import fs from "fs";
import { findClosestIndexFolder, findProjectRoot } from "../utils/tools.js";
import { ChildManager } from "./ChildManager.js";
import questsConfig from "../config/questsConfig.js";

export class CustomClient extends Client {
    constructor(options) {
        super(options);
        
        // Initialize collections
        this.cooldowns = new Collection();
        this.messageCommands = new Collection();
        this.slashCommands = new Collection();
        this.buttons = new Collection();
        this.menus = new Collection();
        this.i18n = new I18nManager(config.defaultLanguage);
        this.guildSettings = new Collection();
        this.userSettings = new Collection();
        this.proxy = new Collection();
        this.images = new Collection();
        this.questsSupported = [];
        
        // Private properties
        this.ready = false;
        this.config = config;
        this.#emojiTasks = new Map();
        
        // Setup event listeners
        this.setupEvents();
    }
    
    setupEvents() {
        this.once("ready", async () => {
            await this.onReady();
        });
    }
    
    async onReady() {
        Logger.info(`✅ Client ready! Logged in as ${this.user.tag}`);
        this.ready = true;
        
        // Load various components
        await this.loadQuests();
        await this.loadEmojis();
        await this.loadChildProcess();
        await this.loadProxy();
        
        // Update bot status
        this.updateActivity();
        this.user.setStatus("idle");
        
        // Set interval for activity updates
        setInterval(() => this.updateActivity(), 30000);
        
        Logger.info("✅ All systems initialized successfully");
    }
    
    async loadQuests() {
        try {
            const rootDir = findClosestIndexFolder();
            const questsFolder = path.join(rootDir, "quests");
            
            if (!fs.existsSync(questsFolder)) {
                fs.mkdirSync(questsFolder, { recursive: true });
                Logger.warn(`📁 Created quests directory at ${questsFolder}`);
                return;
            }
            
            const questFiles = fs.readdirSync(questsFolder)
                .filter(file => file.endsWith('.js'));
            
            for (const file of questFiles) {
                try {
                    const filePath = path.join(questsFolder, file);
                    const module = await import(`file://${filePath}`);
                    
                    if (module.default && module.default.name) {
                        this.questsSupported.push(module.default.name);
                    }
                } catch (error) {
                    Logger.error(`❌ Error loading quest file ${file}:`, error);
                }
            }
            
            Logger.info(`✅ Loaded ${this.questsSupported.length} quests: ${this.questsSupported.join(', ')}`);
        } catch (error) {
            Logger.error("❌ Error loading quests:", error);
        }
    }
    
    async loadEmojis() {
        try {
            await this.application.emojis.fetch();
            Logger.info(`✅ Loaded ${this.application.emojis.cache.size} emojis from Discord`);
            
            // Load custom emojis from local folder
            const emojiFolderPath = path.join(findProjectRoot(), "emojis");
            if (fs.existsSync(emojiFolderPath)) {
                const emojiFiles = fs.readdirSync(emojiFolderPath)
                    .filter(file => /\.(png|gif|jpg|jpeg)$/i.test(file));
                
                Logger.info(`📁 Found ${emojiFiles.length} local emoji files`);
            }
        } catch (error) {
            Logger.error("❌ Error loading emojis:", error);
        }
    }
    
    async loadChildProcess() {
        try {
            await ChildManager.loadChildProcess();
            Logger.info(`✅ Child processes loaded: ${ChildManager.pids.length}`);
        } catch (error) {
            Logger.error("❌ Error loading child processes:", error);
        }
    }
    
    async loadProxy() {
        try {
            const proxyPath = path.join(findProjectRoot(), 'proxy.txt');
            if (fs.existsSync(proxyPath)) {
                const data = fs.readFileSync(proxyPath, 'utf8');
                const lines = data.split('\n').filter(line => line.trim());
                
                this.proxy.clear();
                for (const line of lines) {
                    const parts = line.trim().split(":");
                    if (parts.length === 4) {
                        this.proxy.set(line, {
                            ip: `${parts[0]}:${parts[1]}`,
                            authentication: `${parts[2]}:${parts[3]}`
                        });
                    }
                }
                
                Logger.info(`✅ Loaded ${this.proxy.size} proxies`);
            }
        } catch (error) {
            Logger.error("❌ Error loading proxies:", error);
        }
    }
    
    // Utility methods
    getEmoji(emojiName, returnBlank = true) {
        const emoji = this.application.emojis.cache.find(
            e => e.name?.toLowerCase() === emojiName?.toLowerCase()
        );
        return emoji ? emoji.toString() : (returnBlank ? "" : null);
    }
    
    async createEmoji(emojiName, emojiUrl, force = false) {
        const existing = this.getEmoji(emojiName, false);
        if (existing && !force) return existing;
        
        try {
            const createdEmoji = await this.application.emojis.create({
                attachment: emojiUrl,
                name: emojiName
            });
            
            Logger.info(`✅ Created emoji: ${createdEmoji.name}`);
            return createdEmoji.toString();
        } catch (error) {
            Logger.error(`❌ Error creating emoji ${emojiName}:`, error);
            return null;
        }
    }
    
    getCommandName(interaction) {
        if (!interaction.isChatInputCommand()) return null;
        
        let commandName = interaction.commandName.toLowerCase();
        const subCommandName = interaction.options.getSubcommand(false);
        const subCommandGroupName = interaction.options.getSubcommandGroup(false);
        
        if (subCommandGroupName) commandName += `-${subCommandGroupName}`;
        if (subCommandName) commandName += `-${subCommandName}`;
        
        return commandName;
    }
    
    isSnowflakeId(id) {
        try {
            const snowflakeRegex = /^\d{17,19}$/;
            const timestamp = SnowflakeUtil.timestampFrom(id);
            return snowflakeRegex.test(id) && timestamp > 0;
        } catch {
            return false;
        }
    }
    
    updateActivity() {
        if (!this.user) return;
        
        const activityText = `Managing ${ChildManager.TotalUsage}/${ChildManager.maxUsage} quests`;
        this.user.setActivity(activityText, {
            type: ActivityType.Competing,
            url: questsConfig.inviteUrl
        });
    }
    
    // Time formatting
    formatDuration = (ms, lang, units) => {
        const duration = require('humanize-duration');
        return duration(ms, {
            language: lang || this.config.defaultLanguage,
            round: true,
            units: units || ["y", "mo", "w", "d", "h", "m", "s"]
        }) || "0";
    };
    
    clientMs = ms;
    ms = ms;
    
    // Getters
    get emojisList() {
        return {
            quest: this.getEmoji("quest", true) || "🎉",
            completed: this.getEmoji("completed", true) || "✅",
            start: this.getEmoji("start", true) || "▶️",
            stop: this.getEmoji("stop", true) || "⏹️",
            error: this.getEmoji("error", true) || "❌",
            warning: this.getEmoji("warning", true) || "⚠️",
            info: this.getEmoji("info", true) || "ℹ️"
        };
    }
      }
