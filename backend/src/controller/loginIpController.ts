import { AppDataSource } from "../data-source";
import { LoginIp } from "../entity/loginIp";
import { Usuario } from "../entity/users";
import nodemailer from 'nodemailer';

const loginIpRepository = AppDataSource.getRepository(LoginIp);
const userRepository = AppDataSource.getRepository(Usuario);

// Add a set to track recently notified IPs for each user
const recentNotifications = new Map<string, Set<string>>();

// Check if IP is known for user and return true if new IP
export const checkAndRecordLoginIp = async (
    userId: string,
    ipAddress: string,
    deviceInfo?: string
): Promise<{ isNewIp: boolean, ipInfo?: LoginIp }> => {
    try {
        // Find user
        const user = await userRepository.findOne({ where: { usuarioID: userId } });
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Check if this IP has been used before
        let ipInfo = await loginIpRepository.findOne({
            where: {
                user: { usuarioID: userId },
                ipAddress
            }
        });

        // If IP is already known, just update the last seen timestamp
        if (ipInfo) {
            ipInfo.lastSeen = new Date();
            if (deviceInfo && !ipInfo.deviceInfo) {
                ipInfo.deviceInfo = deviceInfo;
            }
            await loginIpRepository.save(ipInfo);
            return { isNewIp: false, ipInfo };
        }

        // Create new IP record
        const newIp = loginIpRepository.create({
            ipAddress,
            deviceInfo: deviceInfo || "Unknown device",
            user,
            isTrusted: false // New IPs are untrusted by default
        });

        ipInfo = await loginIpRepository.save(newIp);
        
        return { isNewIp: true, ipInfo };
    } catch (error) {
        console.error('Error checking/recording login IP:', error);
        throw error;
    }
};

// Get all IPs for a user
export const getUserLoginIps = async (userId: string) => {
    try {
        const ips = await loginIpRepository.find({
            where: {
                user: { usuarioID: userId }
            },
            order: {
                lastSeen: 'DESC'
            }
        });

        return {
            success: true,
            ips
        };
    } catch (error: any) {
        console.error('Erro ao buscar IPs de login:', error);
        return {
            success: false,
            error: 'Erro ao buscar IPs de login',
            details: error.message
        };
    }
};

// Mark an IP as trusted or untrusted
export const updateIpTrustStatus = async (
    userId: string,
    ipId: string,
    isTrusted: boolean
) => {
    try {
        const ip = await loginIpRepository.findOne({
            where: {
                id: ipId,
                user: { usuarioID: userId }
            }
        });

        if (!ip) {
            return {
                success: false,
                error: 'IP de login não encontrado'
            };
        }

        ip.isTrusted = isTrusted;
        await loginIpRepository.save(ip);

        return {
            success: true,
            message: `IP ${isTrusted ? 'marcado como confiável' : 'marcado como não confiável'}`,
            ip
        };
    } catch (error: any) {
        console.error('Erro ao atualizar status de confiança do IP:', error);
        return {
            success: false,
            error: 'Erro ao atualizar status de confiança do IP',
            details: error.message
        };
    }
};

// Send email notification about new login IP
export const sendNewIpLoginNotification = async (
    user: Usuario,
    ipAddress: string,
    deviceInfo?: string
) => {
    console.log('Attempting to send notification email to:', user.email);
    console.log('IP address:', ipAddress);
    
    // Create a unique key for this user+IP combination
    const notificationKey = `${user.usuarioID}:${ipAddress}`;
    
    // Check if we've already sent a notification recently (last 10 seconds)
    const recentUserNotifications = recentNotifications.get(user.usuarioID) || new Set();
    if (recentUserNotifications.has(ipAddress)) {
        console.log('Skipping duplicate notification for this IP:', ipAddress);
        return false;
    }
    
    // Mark this IP as recently notified
    recentUserNotifications.add(ipAddress);
    recentNotifications.set(user.usuarioID, recentUserNotifications);
    
    // Clear the notification record after 10 seconds to prevent throttling legitimate notifications
    setTimeout(() => {
        const userSet = recentNotifications.get(user.usuarioID);
        if (userSet) {
            userSet.delete(ipAddress);
            if (userSet.size === 0) {
                recentNotifications.delete(user.usuarioID);
            }
        }
    }, 10000);
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sync23417@gmail.com',
                pass: 'oxaz rref jpee vgqy'
            }
        });

        const currentDate = new Date().toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo' 
        });

        const mailOptions = {
            from: 'sync23417@gmail.com',
            to: user.email,
            subject: 'Alerta de Segurança: Login detectado',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #F44336; text-align: center;">Alerta de Segurança</h2>
                    <p>Olá ${user.nome},</p>
                    <p>Detectamos um login na sua conta a partir do seguinte endereço IP:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p><strong>Endereço IP:</strong> ${ipAddress}</p>
                        <p><strong>Dispositivo:</strong> ${deviceInfo || 'Desconhecido'}</p>
                        <p><strong>Data e Hora:</strong> ${currentDate}</p>
                    </div>
                    <p>Se foi você quem fez este login, você pode acessar o menu de segurança e marcar este IP como confiável para parar de receber estes alertas.</p>
                    <p style="color: #F44336; font-weight: bold;">Se você não reconhece este login, recomendamos que altere sua senha imediatamente.</p>
                    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #777; font-size: 12px;">Este é um email automático de segurança. Por favor não responda.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email de notificação enviado com sucesso:', info.response);
        console.log('Email enviado para:', user.email);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email de notificação:', error);
        return false;
    }
};
