import { In } from 'typeorm';
import { AppDataSource } from "../data-source";
import { Usuario } from "../entity/users";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { Password } from '../entity/password';
import { listarSenhas } from './passwordController';
import { checkAndRecordLoginIp, sendNewIpLoginNotification } from "./loginIpController";

const userRepository = AppDataSource.getRepository(Usuario);

export const buscarUsuarioPorId = async (id: string) => {
    try {
        const usuario = await userRepository.findOneBy({ usuarioID: id });
        if (!usuario) {
            return { 
                error: 'Usuário não encontrado' 
            };
        }

        return { 
            success: true,
            user: usuario 
        };
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return { 
            error: 'Erro ao buscar usuário',
            details: error.message 
        };
    }
}

export const criarUsuario = async (nome: string, email: string, senha: string, isAdmin: boolean = false) => {
    try {
        // Verifica se já existe um usuário com o mesmo email
        const usuarioExistente = await userRepository.findOneBy({ email });
        if (usuarioExistente) {
            return { error: 'Usuário já cadastrado' };
        }

        // Cria uma nova instância do usuário
        const novoUsuario = new Usuario();
        novoUsuario.nome = nome;
        novoUsuario.email = email;
        novoUsuario.senha = senha; // A senha será hasheada automaticamente pelo @BeforeInsert
        novoUsuario.isAdmin = isAdmin;

        // Salva o usuário no banco de dados
        const usuarioSalvo = await userRepository.save(novoUsuario);
        
        // Remove a senha do objeto retornado
        delete usuarioSalvo.senha;
        
        return { 
            success: true, 
            message: 'Usuário criado com sucesso',
            user: usuarioSalvo 
        };
    } catch (error) {
        console.error('Erro na criação do usuário:', error);
        return { 
            error: 'Erro ao criar usuário',
            details: error.message 
        };
    }
}

export const excluirUsuario = async (id: string) => {
    try {
        const usuario = await userRepository.findOneBy({ usuarioID: id });
        if (!usuario) {
            return { 
                error: 'Usuário não encontrado' 
            };
        }

        await userRepository.remove(usuario);
        return { 
            success: true,
            message: 'Usuário excluído com sucesso' 
        };
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return { 
            error: 'Erro ao excluir usuário',
            details: error.message 
        };
    }
}

export const validarToken = async (token: string) => {
    try {
        if (!jwt.verify(token, "secret")) {
            console.log('Token inválido');
            return false;
        }
        console.log('Token válido');
        return true;
    } catch (error) {
        console.error("Erro na hora de procurar um usuario", error);
        return false;
    }
}

export const mandarToken = async(email: string) => {
    try {
        if (!email) {
            console.log("Email não fornecido!");
            return 'Email não fornecido'
        }

        if (!await userRepository.findOneBy({ email })) {
            console.log("Usuário inexistente!");
            return 'Usuário inexistente'
        }

        const token = jwt.sign({ email }, "oxaz rref jpee vgqy", { expiresIn: "1h"});

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sync23417@gmail.com',
                pass: 'oxaz rref jpee vgqy'
            }
        })

        const mailOptions = {
            from: 'sync23417@gmail.com',
            to: email,
            subject: 'Recuperação de senha',
            text: `Você solicitou a redefinição de senha. Clique no link abaixo para redefinir sua senha:\n\nhttp://172.20.10.3:8081/reset-password/${token}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #4285F4; text-align: center;">Recuperação de Senha</h2>
                    <p>Você solicitou a redefinição de senha para sua conta no Gerenciador de Senhas.</p>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://172.20.10.3:8081/reset-password/${token}" 
                           style="background-color: #4285F4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Redefinir Minha Senha
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Este link é válido por 1 hora. Se você não solicitou esta alteração, ignore este email.</p>
                </div>
            `
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar email:', error);
                return 'Erro ao enviar email'
            }
            console.log('Email enviado:', info.response);
            return 'Email enviado'
        })
        
        return 'Email enviado'
    } catch (error) {
        console.error('Erro ao mandar token:', error);
        return 'Erro ao mandar token'
    }
}

export const redefinirSenha = async (token: string, novaSenha: string) => {
    try {
        const { email } = jwt.verify(token, "oxaz rref jpee vgqy");
        const usuario = await userRepository.findOneBy({ email });

        if (usuario) {
            const senhaHash = await bcrypt.hash(novaSenha, 10);
            usuario.senha = senhaHash;
            await userRepository.save(usuario);
            return usuario;
        } else {
            console.log("Usuário não encontrado");
            return 'Usuário não encontrado';
        }

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        return 'Erro ao redefinir senha';
    } 
}

export const login = async (email: string, senha: string, ipAddress: string, userAgent?: string) => {
    try {
        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: 'Email inválido'
            };
        }

        const usuario = await userRepository.findOneBy({ email: email });

        if (usuario) {
            const passwordMatch = await bcrypt.compare(senha, usuario.senha);

            if (passwordMatch) {
                const token = jwt.sign(
                    { usuarioID: usuario.usuarioID },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                // Track IP in background after returning the success response
                // No need to await these operations
                if (ipAddress) {
                    // Use .then() to handle the promise without awaiting
                    checkAndRecordLoginIp(usuario.usuarioID, ipAddress, userAgent)
                        .then(({ isNewIp, ipInfo }) => {
                            // Only send notification if IP is untrusted
                            if (!ipInfo.isTrusted) {
                                console.log('Sending notification in background for IP:', ipAddress);
                                // Send email notification asynchronously
                                sendNewIpLoginNotification(usuario, ipAddress, userAgent)
                                    .catch(err => console.error('Failed to send IP notification:', err));
                            }
                        })
                        .catch(error => {
                            console.error('IP tracking error (background):', error);
                        });
                }

                // Return success response immediately without waiting for IP tracking
                return {
                    success: true,
                    message: 'Login realizado com sucesso',
                    token: token,
                    usuarioID: usuario.usuarioID
                };
            } else {
                return {
                    success: false,
                    error: 'Senha incorreta'
                };
            }
        } else {
            return {
                success: false,
                error: 'Usuário não encontrado'
            };
        }

    } catch (error: any) {
        console.error('Erro ao fazer login:', error);
        return {
            success: false,
            error: 'Erro ao fazer login',
            details: error.message
        };
    } 
};

export const alterarUsuario = async (id: string, nome: string, email: string, senha: string, isAdmin: boolean) => {
    try {
        const usuario = await userRepository.findOneBy({ usuarioID: id });
        if (!usuario) {
            return { 
                error: 'Usuário não encontrado' 
            };
        }

        usuario.nome = nome;
        usuario.email = email;
        usuario.senha = senha;
        usuario.isAdmin = isAdmin;

        await userRepository.save(usuario);
        return { 
            success: true,
            message: 'Usuário alterado com sucesso' 
        };
    } catch (error) {
        console.error('Erro ao alterar usuário:', error);
        return { 
            error: 'Erro ao alterar usuário',
            details: error.message 
        };
    }
}

export const pinLogin = async (email: string, ipAddress: string, userAgent?: string) => {
    try {
        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: 'Email inválido'
            };
        }

        const usuario = await userRepository.findOneBy({ email: email });

        if (!usuario) {
            return {
                success: false,
                error: 'Usuário não encontrado'
            };
        }

        if (!usuario.pinEnabled) {
            return {
                success: false,
                error: 'Login com PIN não está habilitado para este usuário'
            };
        }

        const token = jwt.sign(
            { usuarioID: usuario.usuarioID },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Just record IP in the background for PIN logins
        if (ipAddress) {
            // Don't await, run in background
            checkAndRecordLoginIp(usuario.usuarioID, ipAddress, userAgent)
                .catch(error => {
                    console.error('IP tracking error (background):', error);
                });
        }

        // Return success immediately
        return {
            success: true,
            message: 'Login realizado com sucesso',
            token: token,
            user: {
                usuarioID: usuario.usuarioID,
                nome: usuario.nome,
                email: usuario.email
            }
        };
    } catch (error: any) {
        console.error('Erro ao fazer login com PIN:', error);
        return {
            success: false,
            error: 'Erro ao fazer login com PIN',
            details: error.message
        };
    }
}
