import SlashCommand from "../lib/handler/slashCommand.js";
import { SlashCommandBuilder } from "discord.js";

export default class Ping extends SlashCommand {
    constructor() {
        super();
        this.name = "ping";
        this.description = "Check bot latency";
        this.cooldown = "5s";
        this.flags = ["ephemeral"];
    }
    
    async execute({ interaction, client, i18n }) {
        const start = Date.now();
        
        await interaction.deferReply({ ephemeral: this.hasFlag("ephemeral") });
        
        const latency = Date.now() - start;
        const apiLatency = Math.round(client.ws.ping);
        
        const response = i18n.t("commands.ping.response", {
            latency: latency,
            apiLatency: apiLatency
        });
        
        await interaction.editReply(response);
    }
}
