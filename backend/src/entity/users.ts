import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate, Index } from "typeorm";
import { Password } from "./password";
import * as bcrypt from "bcrypt";

@Entity("users")
export class Usuario {
    @PrimaryGeneratedColumn("uuid")
    usuarioID: string;

    @Column({ 
        type: "varchar", 
        length: 100, 
        nullable: false 
    })
    nome: string;

    @Index("idx_usuario_email")
    @Column({ 
        type: "varchar", 
        length: 100, 
        unique: true, 
        nullable: false 
    })
    email: string;

    @Column({ 
        type: "varchar", 
        length: 60,
        nullable: false 
    })
    senha: string;

    @Column({ 
        type: "boolean", 
        default: false 
    })
    isAdmin: boolean;

    @Column({ 
        type: "boolean", 
        default: false 
    })
    pinEnabled: boolean;

    // Relação com a entidade Password
    @OneToMany(() => Password, (password: Password) => password.user, {
        cascade: true,
        eager: false, // Não carrega automaticamente as senhas
        onDelete: "CASCADE" // Se o usuário for deletado, deleta todas as senhas
    })
    passwords: Password[];

    // Hash da senha antes de inserir ou atualizar
    @BeforeInsert()
    @BeforeUpdate()
    async hashSenha() {
        // Só faz o hash se a senha foi modificada
        if (this.senha && this.senha.length < 60) { // Verifica se não é um hash bcrypt (que tem 60 caracteres)
            const salt = await bcrypt.genSalt(10);
            this.senha = await bcrypt.hash(this.senha, salt);
        }
    }

    // Método para verificar senha
    async verificarSenha(senhaInformada: string): Promise<boolean> {
        return await bcrypt.compare(senhaInformada, this.senha);
    }
}