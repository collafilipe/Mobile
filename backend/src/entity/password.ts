import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn, 
    ManyToOne,
    Index
} from "typeorm";
import { Usuario } from "./users";

@Entity("passwords")
export class Password {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ 
        type: "varchar", 
        length: 100, 
        nullable: false 
    })
    name: string;

    @Column({ 
        type: "text", 
        nullable: false 
    })
    password: string;

    @Column({ 
        type: "boolean", 
        default: false 
    })
    favorite: boolean;

    @CreateDateColumn({ 
        name: 'created_at', // Esse é o nome que será usado na tabela
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at', // Se quiser controlar atualizações
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    updatedAt: Date;

    @Index("idx_password_user")
    @ManyToOne(() => Usuario, (user: Usuario) => user.passwords, {
        nullable: false,
        onDelete: "CASCADE"
    })
    user: Usuario;
}
