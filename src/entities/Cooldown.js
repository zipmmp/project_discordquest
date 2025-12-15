import { Entity, Column, Index, CreateDateColumn } from "typeorm";
import BaseDocument from "../lib/handler/BaseDocument.js";

@Entity("cooldowns")
export class Cooldown extends BaseDocument {
    @Column()
    cdKey;
    
    @Column({ type: "bigint" })
    time;
    
    @Column({ type: "timestamp" })
    @Index()
    expireDate;
}

export default Cooldown;
