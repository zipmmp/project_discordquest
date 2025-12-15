import { baseDiscordEvent } from "../lib/handler/baseClientEvent.js";
import config from "../config/config.js";
import { CooldownManager } from "../lib/cooldown/cooldown.js";
import { EmbedBuilder } from "../lib/handler/embedBuilder.js";

export default class MessageHandler extends baseDiscordEvent {
    name = "messageCreate";
    once = false;
    
    async executeEvent(message) {
        if (!message.content || message.author.bot || !this.client.ready) return;
        
        const replyMessage = async (content) => {
            const embed = new EmbedBuilder().setDescription(content);
            return message.reply({
                embeds: [embed],
                allowedMentions: { repliedUser: true }
            }).catch(err => {
                this.logger.error(`Failed to reply to message ${message.id}:`, err);
            });
        };
        
        const guildConfig = message.guildId && this.client.guildSettings.get(message.guildId) || null;
        const lang = guildConfig?.lang || this.client.config?.defaultLanguage || "en";
        const i18n = this.client.i18n.get(lang);
        const prefix = guildConfig?.prefix || config?.prefix || "!";
        
        if (!message.content.startsWith(prefix)) return;
        
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift()?.toLowerCase();
        const command = this.client.messageCommands.get(cmd) || 
                       this.client.messageCommands.find(e => e?.hasAlias(cmd));
        
        if (!command) return;
        
        const commandKey = command.getCommandKey();
        const commandCd = command.getCooldown();
        const cdKey = command.hasFlag("userCooldown") ? 
            `${commandKey}-${message.author.id}` : 
            `${message.author.id}-${commandKey}-${message.guild?.id || "dm"}`;
        const dbCd = command.hasFlag("cooldownDatabase");
        const cd = await CooldownManager.get(cdKey, dbCd);
        
        const argsCheck = command.greaterThanMinArgs(args.length) && 
                         command.lessThanMaxArgs(args.length);
        
        if (!command.enabled) return replyMessage(i18n.t("commandDisabled"));
        
        if (command.hasFlag("onlyGuild") && !message.guild && !command.hasFlag("onlyDm")) {
            return replyMessage(i18n.t("guildOnly"));
        }
        
        if (!argsCheck) return replyMessage(i18n.t("badUsage", { usage: command.getUsage(prefix) }));
        
        if (cd) {
            const remaining = this.client.formatDuration(cd.getRemaining(), lang);
            return replyMessage(i18n.t("cooldown", { time: remaining }));
        }
        
        if (command.hasFlag("ownerOnly") && !config?.developers?.includes(message.author.id)) {
            return replyMessage(i18n.t("developerOnly"));
        }
        
        // Execute command
        try {
            CooldownManager.create(cdKey, commandCd, dbCd);
            
            if (command.hasFlag("deleteMessage")) {
                if (message.guild && message.guild.members.me.permissions.has("ManageMessages")) {
                    await message.delete().catch(err => {
                        this.logger.error(`Failed to delete message ${message.id}:`, err);
                    });
                }
            }
            
            await command.execute({
                message,
                i18n,
                client: this.client,
                lang,
                args,
                guildConfig,
            });
            
            this.logger.info(`Executed command ${cmd} for user ${message.author.tag}`);
        } catch (err) {
            this.logger.error(`Failed to execute command ${cmd}:`, err);
            replyMessage(i18n.t("commandError"));
        }
    }
                                                                          }
