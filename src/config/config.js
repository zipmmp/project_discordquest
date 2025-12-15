Enterimport { SupportedDatabaseTypes } from "../core/DatabaseConfig.js";

const config = {
    // Discord Bot Token (Required)
    token: process.env.DISCORD_TOKEN || "",
    
    // Bot Configuration
    prefix: process.env.PREFIX || "!",
    embedColor: process.env.EMBED_COLOR || "#5865F2",
    defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
    debugMode: process.env.DEBUG_MODE === "true",
    
    // Security
    developers: (process.env.DEVELOPERS || "").split(",").filter(id => id.trim()),
    allowedServers: (process.env.ALLOWED_SERVERS || "").split(",").filter(id => id.trim()),
    
    // Database Configuration
    database: (() => {
        const dbType = process.env.DB_TYPE || "sqlite";
        
        switch (dbType) {
            case SupportedDatabaseTypes.Mysql:
                return {
                    type: SupportedDatabaseTypes.Mysql,
                    host: process.env.DB_HOST || "localhost",
                    port: parseInt(process.env.DB_PORT) || 3306,
                    user: process.env.DB_USER || "root",
                    password: process.env.DB_PASSWORD || "",
                    database: process.env.DB_NAME || "discord_bot"
                };
                
            case SupportedDatabaseTypes.MongoDB:
                return {
                    type: SupportedDatabaseTypes.MongoDB,
                    url: process.env.DB_URL || "mongodb://localhost:27017/discord_bot"
                };
                
            case SupportedDatabaseTypes.Sqlite:
            default:
                return {
                    type: SupportedDatabaseTypes.Sqlite,
                    path: process.env.DB_PATH || "./database.sqlite"
                };
        }
    })(),
    
    // Paths
    seasonsPath: process.env.SEASONS_PATH || "./seasons",
    
    // Validation
    validate() {
        const errors = [];
        
        if (!this.token) errors.push("DISCORD_TOKEN is required");
        if (!this.prefix) errors.push("PREFIX is required");
        
        if (errors.length > 0) {
            throw new Error(`Configuration errors:\n${errors.join("\n")}`);
        }
        
        return true;
    }
};

// Validate configuration on import
try {
    config.validate();
    console.log("✅ Configuration loaded successfully");
} catch (error) {
    console.error("❌ Configuration error:", error.message);
    process.exit(1);
}

export default config;
