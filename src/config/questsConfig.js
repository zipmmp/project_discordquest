const questsConfig = {
    // Child Process Configuration
    childProcessCount: parseInt(process.env.CHILD_PROCESS_COUNT) || 3,
    questsPerChildProcess: parseInt(process.env.QUESTS_PER_CHILD) || 5,
    
    // Server Configuration
    serverId: process.env.SERVER_ID || "",
    
    // Voice Configuration
    voice: {
        channel: process.env.VOICE_CHANNEL_ID || "",
        role: process.env.VOICE_ROLE_ID || ""
    },
    
    // Notification Configuration
    notification: {
        token: process.env.NOTIFICATION_TOKEN || "",
        channel: process.env.NOTIFICATION_CHANNEL_ID || "",
        role: process.env.NOTIFICATION_ROLE_ID || "",
        dm: {
            enabled: process.env.DM_NOTIFICATIONS === "true",
            dmRoles: (process.env.DM_ROLES || "").split(",").filter(id => id)
        }
    },
    
    // Proxy Configuration
    proxyType: process.env.PROXY_TYPE || "http",
    
    // URLs
    inviteUrl: process.env.INVITE_URL || "https://discord.gg/example",
    completedQuestsChannel: process.env.COMPLETED_QUESTS_CHANNEL || "",
    
    // Quest Settings
    durationQuests: ["PLAY_ACTIVITY", "PLAY_ON_DESKTOP", "WATCH_VIDEO", "WATCH_VIDEO_ON_MOBILE"],
    
    // Custom Rewards
    customRewardsImage: {},
    customRewardsEmoji: {},
    
    // Buttons (for quest interface)
    buttons: [
        {
            text: "Support Server",
            url: "https://discord.gg/support",
            emoji: "🛠️"
        },
        {
            text: "Documentation",
            url: "https://docs.example.com",
            emoji: "📚"
        }
    ],
    
    // Logging
    logStrings: [
        "========================================",
        "Quest Progress Log",
        "========================================"
    ],
    
    // Methods
    isValid() {
        const errors = [];
        
        if (!this.serverId) errors.push("SERVER_ID is required");
        if (this.childProcessCount < 1) errors.push("CHILD_PROCESS_COUNT must be at least 1");
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

// Validate configuration
const validation = questsConfig.isValid();
if (!validation.valid) {
    console.warn("⚠️ Quest configuration warnings:", validation.errors.join(", "));
}

export default questsConfig;
