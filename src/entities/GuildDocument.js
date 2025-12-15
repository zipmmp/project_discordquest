import { Entity, Column } from "typeorm";
import BaseDocument from "../lib/handler/BaseDocument.js";
import config from "../config/config.js";

@Entity("guilds")
export class GuildDocument extends BaseDocument {
    @Column()
    guildId;
    
    @Column({ nullable: true })
    prefix;
    
    @Column({ default: false })
    ticketSystem;
    
    @Column({ nullable: true, default: config.defaultLanguage })
    lang;
    
    @Column("simple-json", { nullable: true })
    commands;
}

export default GuildDocument;
