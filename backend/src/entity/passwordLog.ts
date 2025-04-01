import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    ManyToOne,
    Index
} from "typeorm";
import { Usuario } from "./users";

@Entity("password_logs")
export class PasswordLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ 
        nullable: false
    })
    passwordId: string;

    @Column({ 
        type: "varchar", 
        length: 100, 
        nullable: false 
    })
    passwordName: string;

    @Column({ 
        type: "varchar", 
        length: 100, 
        nullable: true 
    })
    previousValue: string;

    @Column({ 
        type: "varchar", 
        length: 100, 
        nullable: true 
    })
    newValue: string;

    @Column({ 
        type: "varchar", 
        length: 255, 
        nullable: true 
    })
    encryptedPreviousValue: string;

    @Column({ 
        type: "varchar", 
        length: 255, 
        nullable: true 
    })
    encryptedNewValue: string;

    @Column({
        type: "boolean",
        default: false
    })
    containsSensitiveData: boolean;

    @Column({ 
        type: "enum", 
        enum: ["create", "update", "delete"],
        nullable: false
    })
    actionType: "create" | "update" | "delete";

    @Column({
        type: "varchar",
        length: 50,
        nullable: true
    })
    fieldChanged: string;

    @CreateDateColumn({ 
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    timestamp: Date;

    @Index("idx_passwordlog_user")
    @ManyToOne(() => Usuario, {
        nullable: false,
        onDelete: "CASCADE"
    })
    user: Usuario;
}
