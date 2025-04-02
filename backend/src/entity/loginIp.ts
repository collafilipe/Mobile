import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    ManyToOne,
    Index
} from "typeorm";
import { Usuario } from "./users";

@Entity("login_ips")
export class LoginIp {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ 
        type: "varchar", 
        length: 45, 
        nullable: false 
    })
    ipAddress: string;

    @Column({ 
        type: "varchar", 
        length: 255, 
        nullable: true 
    })
    deviceInfo: string;

    @Column({ 
        type: "varchar", 
        length: 100, 
        nullable: true 
    })
    location: string;

    @Column({ 
        type: "boolean", 
        default: true 
    })
    isTrusted: boolean;

    @CreateDateColumn({ 
        name: 'first_seen',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    firstSeen: Date;

    @CreateDateColumn({ 
        name: 'last_seen',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    lastSeen: Date;

    @Index("idx_loginip_user")
    @ManyToOne(() => Usuario, {
        nullable: false,
        onDelete: "CASCADE"
    })
    user: Usuario;
}
