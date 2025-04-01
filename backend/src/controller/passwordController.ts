import { AppDataSource } from "../data-source";
import { Password } from "../entity/password";
import { Usuario } from "../entity/users";
import bcrypt from "bcrypt";
import { getRepository } from "typeorm";
import { createPasswordLog } from "./passwordLogController";

const passwordRepository = AppDataSource.getRepository(Password);
const userRepository = AppDataSource.getRepository(Usuario);

// ✅ Listar Senhas
export const listarSenhas = async (userId: string, filtros?: { favorite?: boolean }) => {
    try {
        const queryBuilder = passwordRepository
            .createQueryBuilder("password")
            .where("password.user = :userId", { userId })
            .orderBy("password.created_at", "DESC"); // ✅ Corrigido para bater com o banco

        if (filtros?.favorite !== undefined) {
            queryBuilder.andWhere("password.favorite = :favorite", { favorite: filtros.favorite });
        }

        const senhas = await queryBuilder.getMany();

        return {
            success: true,
            passwords: senhas
        };
    } catch (error: any) {
        console.error('Erro ao listar senhas:', error);
        return {
            success: false,
            error: 'Erro ao listar senhas',
            details: error.message
        };
    }
};

// ✅ Buscar senha por ID
export const buscarSenhaPorId = async (userId: string, passwordId: string) => {
    // Validar os parâmetros antes de fazer a consulta
    if (!userId || !passwordId || passwordId === 'undefined' || passwordId === 'null') {
        console.log('Parâmetros inválidos:', { userId, passwordId });
        return {
            success: false,
            error: 'Parâmetros inválidos'
        };
    }

    try {
        const senha = await passwordRepository.findOne({
            where: {
                id: passwordId,
                user: { usuarioID: userId }
            }
        });

        if (!senha) {
            console.log('Senha não encontrada:', { userId, passwordId });
            return {
                success: false,
                error: 'Senha não encontrada'
            };
        }

        console.log('Senha encontrada com sucesso:', { 
            userId, 
            passwordId, 
            name: senha.name 
        });

        return {
            success: true,
            password: senha
        };
    } catch (error: any) {
        console.error('Erro ao buscar senha:', error);
        return {
            success: false,
            error: 'Erro ao buscar senha',
            details: error.message
        };
    }
};

// ✅ Criar senha
export const criarSenha = async (
    userId: string,
    name: string,
    password: string,
    favorite: boolean = false
) => {
    try {
        const user = await userRepository.findOne({ where: { usuarioID: userId } });

        if (!user) {
            return {
                success: false,
                error: 'Usuário não encontrado'
            };
        }

        const novaSenha = passwordRepository.create({
            name,
            password,
            favorite,
            user
        });

        const senhaSalva = await passwordRepository.save(novaSenha);
        
        // Log the action
        await createPasswordLog(userId, senhaSalva.id, name, "create");

        return {
            success: true,
            message: 'Senha criada com sucesso',
            password: senhaSalva
        };
    } catch (error: any) {
        console.error('Erro ao criar senha:', error);
        return {
            success: false,
            error: 'Erro ao criar senha',
            details: error.message
        };
    }
};

// ✅ Excluir senha
export const excluirSenha = async (userId: string, id: string) => {
    try {
        const senha = await passwordRepository.findOne({
            where: {
                id,
                user: { usuarioID: userId }
            }
        });

        if (!senha) {
            return {
                success: false,
                error: 'Senha não encontrada'
            };
        }
        
        // Store the name before deletion for logging
        const passwordName = senha.name;
        
        await passwordRepository.remove(senha);
        
        // Log the action
        await createPasswordLog(userId, id, passwordName, "delete");

        return {
            success: true,
            message: 'Senha excluída com sucesso'
        };
    } catch (error: any) {
        console.error('Erro ao excluir senha:', error);
        return {
            success: false,
            error: 'Erro ao excluir senha',
            details: error.message
        };
    }
};

// ✅ Atualizar senha
export const atualizarSenha = async (
    userId: string,
    id: string,
    name?: string,
    passwordValue?: string,
    favorite?: boolean
) => {
    try {
        const senha = await passwordRepository.findOne({
            where: {
                id,
                user: { usuarioID: userId }
            }
        });

        if (!senha) {
            return {
                success: false,
                error: 'Senha não encontrada'
            };
        }

        // Track changes for logging
        const originalName = senha.name;
        const originalPassword = senha.password;
        const originalFavorite = senha.favorite;

        // Atualizações condicionais
        if (name !== undefined) senha.name = name;
        if (passwordValue !== undefined) senha.password = passwordValue;
        if (favorite !== undefined) senha.favorite = favorite;

        const senhaAtualizada = await passwordRepository.save(senha);
        
        // Log each change separately
        if (name !== undefined && name !== originalName) {
            await createPasswordLog(
                userId, 
                id, 
                senhaAtualizada.name, 
                "update",
                "name",
                originalName, 
                name
            );
        }
        
        if (passwordValue !== undefined && passwordValue !== originalPassword) {
            // Log password change with actual values for sensitive data
            await createPasswordLog(
                userId, 
                id, 
                senhaAtualizada.name, 
                "update",
                "password",
                "********", // Show asterisks in the UI
                "********", // Show asterisks in the UI
                true, // Mark as sensitive data
                originalPassword, // Original password for encrypted storage
                passwordValue // New password for encrypted storage
            );
        }
        
        if (favorite !== undefined && favorite !== originalFavorite) {
            await createPasswordLog(
                userId, 
                id, 
                senhaAtualizada.name, 
                "update",
                "favorite",
                originalFavorite ? "Sim" : "Não", 
                favorite ? "Sim" : "Não"
            );
        }

        return {
            success: true,
            message: 'Senha atualizada com sucesso',
            password: senhaAtualizada
        };
    } catch (error: any) {
        console.error('Erro ao atualizar senha:', error);
        return {
            success: false,
            error: 'Erro ao atualizar senha',
            details: error.message
        };
    }
};

export const verificarSenha = async (userId: string, password: string) => {
    try {
        const user = await userRepository.findOne({ where: { usuarioID: userId } });

        if (!user) {
            console.log('Usuário não encontrado:', userId);
            return {
                success: false,
                error: 'Usuário não encontrado.'
            };
        }

        console.log('Verificando senha para usuário:', userId);
        console.log('Senha fornecida:', password);
        console.log('Senha armazenada:', user.senha);

        // Comparando a senha fornecida com a senha armazenada (criptografada)
        const isMatch = await bcrypt.compare(password, user.senha);
        console.log('Resultado da comparação:', isMatch);

        if (!isMatch) {
            return {
                success: false,
                error: 'Senha incorreta.'
            };
        }

        return {
            success: true,
            message: 'Senha verificada com sucesso.'
        };
    } catch (error: any) {
        console.error('Erro ao verificar a senha:', error);
        return {
            success: false,
            error: 'Erro ao verificar a senha.',
            details: error.message
        };
    }
};

// ✅ Favoritar senha (toggle)
export const toggleFavorito = async (userId: string, id: string, favorite: boolean) => {
    try {
        const senha = await passwordRepository.findOne({
            where: {
                id,
                user: { usuarioID: userId }
            }
        });

        if (!senha) {
            return {
                success: false,
                error: 'Senha não encontrada'
            };
        }

        senha.favorite = favorite;

        const senhaAtualizada = await passwordRepository.save(senha);

        return {
            success: true,
            message: 'Status de favorito atualizado com sucesso',
            password: senhaAtualizada
        };
    } catch (error: any) {
        console.error('Erro ao atualizar favorito:', error);
        return {
            success: false,
            error: 'Erro ao atualizar favorito',
            details: error.message
        };
    }
};
