import { Entity, Column } from "typeorm";
import BaseDocument from "../lib/handler/BaseDocument.js";
import config from "../config/config.js";

@Entity("users")
export class UserDocument extends BaseDocument {
    @Column()
    userId;
    
    @Column({ default: 0 })
    totalSolvedQuests;
    
    @Column("simple-json", { nullable: true })
    banned;
    
    @Column("simple-json", { nullable: true, default: () => "'[]'" })
    bannedHistory;
    
    @Column({ nullable: true, default: config.defaultLanguage })
    lang;
}

export default UserDocument;
