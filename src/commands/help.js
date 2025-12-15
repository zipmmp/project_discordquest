import MessageCommand from "../lib/handler/messageCommand.js";
import { EmbedBuilder } from "discord.js";

export default class Help extends MessageCommand {
    constructor() {
        super();
        this.name = "help";
        this.aliases = ["مساعدة", "commands"];
        this.description = "Show list of commands";
        this.usage = "{prefix}help [command]";
        this.cooldown = "10s";
        this.flags = [];
    }
    
    async execute({ message, i18n, client, args }) {
        const prefix = message.guild?.prefix || client.config.prefix || "!";
        
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = client.messageCommands.get(commandName) || 
                           client.messageCommands.find(cmd => cmd.aliases?.includes(commandName));
            
            if (command) {
                const embed = new EmbedBuilder()
                    .setTitle(`Command: ${command.name}`)
                    .setColor(client.config.embedColor)
                    .addFields(
                        { name: "Description", value: command.description || "No description" },
                        { name: "Usage", value: command.getUsage(prefix) },
                        { name: "Cooldown", value: client.formatDuration(command.getCooldown()) },
                        { name: "Aliases", value: command.aliases?.join(", ") || "None" }
                    );
                
                return message.reply({ embeds: [embed] });
            }
        }
        
        // Show all commands
        const commands = Array.from(client.messageCommands.values())
            .filter(cmd => cmd.enabled)
            .map(cmd => `**${prefix}${cmd.name}** - ${cmd.description || "No description"}`);
        
        const embed = new EmbedBuilder()
            .setTitle("Available Commands")
            .setColor(client.config.embedColor)
            .setDescription(commands.join("\n"))
            .setFooter({ text: `Use ${prefix}help [command] for more info` });
        
        message.reply({ embeds: [embed] });
    }
}
