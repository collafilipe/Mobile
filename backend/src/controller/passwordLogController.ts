import { AppDataSource } from "../data-source";
import { PasswordLog } from "../entity/passwordLog";
import { Usuario } from "../entity/users";
import bcrypt from "bcrypt";

const passwordLogRepository = AppDataSource.getRepository(PasswordLog);
const userRepository = AppDataSource.getRepository(Usuario);

// Simpler encryption using a reversible algorithm
// Note: This is not as secure as proper encryption, but works for this demo
const simpleEncrypt = (text: string, key: string): string => {
  if (!text) return null;
  
  // Create a simple key from the user ID (or any string)
  const numericKey = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // XOR each character with the key
  return Array.from(text)
    .map(char => {
      const encoded = char.charCodeAt(0) ^ (numericKey % 255);
      return encoded.toString(16).padStart(2, '0');
    })
    .join('');
};

const simpleDecrypt = (encoded: string, key: string): string => {
  if (!encoded) return null;
  
  // Create the same key as used for encryption
  const numericKey = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Parse the hex values and XOR them with the key
  const chunks = [];
  for (let i = 0; i < encoded.length; i += 2) {
    if (i + 1 < encoded.length) {
      chunks.push(encoded.substring(i, i + 2));
    }
  }
  
  return chunks
    .map(hex => {
      const char = parseInt(hex, 16) ^ (numericKey % 255);
      return String.fromCharCode(char);
    })
    .join('');
};

export const createPasswordLog = async (
    userId: string,
    passwordId: string,
    passwordName: string,
    actionType: "create" | "update" | "delete",
    fieldChanged?: string,
    previousValue?: string,
    newValue?: string,
    containsSensitiveData: boolean = false,
    actualPreviousValue?: string,
    actualNewValue?: string
) => {
    try {
        const user = await userRepository.findOne({ where: { usuarioID: userId } });

        if (!user) {
            return {
                success: false,
                error: 'Usuário não encontrado'
            };
        }

        // Encrypt sensitive data with simpler algorithm
        let encryptedPreviousValue = null;
        let encryptedNewValue = null;
        
        if (containsSensitiveData) {
            if (actualPreviousValue) {
                encryptedPreviousValue = simpleEncrypt(actualPreviousValue, userId);
            }
            
            if (actualNewValue) {
                encryptedNewValue = simpleEncrypt(actualNewValue, userId);
            }
        }

        const newLog = passwordLogRepository.create({
            passwordId,
            passwordName,
            actionType,
            fieldChanged,
            previousValue: previousValue || null,
            newValue: newValue || null,
            encryptedPreviousValue,
            encryptedNewValue,
            containsSensitiveData,
            user
        });

        const savedLog = await passwordLogRepository.save(newLog);

        return {
            success: true,
            log: savedLog
        };
    } catch (error: any) {
        console.error('Erro ao criar log de senha:', error);
        return {
            success: false,
            error: 'Erro ao criar log de senha',
            details: error.message
        };
    }
};

export const getPasswordLogs = async (userId: string) => {
    try {
        const logs = await passwordLogRepository.find({
            where: {
                user: { usuarioID: userId }
            },
            order: {
                timestamp: 'DESC'
            },
            take: 50 // Limit to last 50 logs
        });

        return {
            success: true,
            logs
        };
    } catch (error: any) {
        console.error('Erro ao buscar logs de senha:', error);
        return {
            success: false,
            error: 'Erro ao buscar logs de senha',
            details: error.message
        };
    }
};

export const clearPasswordLogs = async (userId: string) => {
    try {
        const user = await userRepository.findOne({ where: { usuarioID: userId } });

        if (!user) {
            return {
                success: false,
                error: 'Usuário não encontrado'
            };
        }

        await passwordLogRepository.delete({
            user: { usuarioID: userId }
        });

        return {
            success: true,
            message: 'Logs de senha limpos com sucesso'
        };
    } catch (error: any) {
        console.error('Erro ao limpar logs de senha:', error);
        return {
            success: false,
            error: 'Erro ao limpar logs de senha',
            details: error.message
        };
    }
};

export const getPasswordLogsWithSensitiveData = async (userId: string, password: string) => {
    try {
        // First verify the user exists and the password is correct
        const user = await userRepository.findOne({ where: { usuarioID: userId } });
        
        if (!user) {
            return {
                success: false,
                error: 'Usuário não encontrado'
            };
        }
        
        // Verify the password
        const passwordMatch = await bcrypt.compare(password, user.senha);
        if (!passwordMatch) {
            return {
                success: false,
                error: 'Senha incorreta'
            };
        }
        
        // Get all the logs
        const logs = await passwordLogRepository.find({
            where: {
                user: { usuarioID: userId }
            },
            order: {
                timestamp: 'DESC'
            },
            take: 50
        });
        
        // Decrypt sensitive values using the simpler method
        const decryptedLogs = logs.map(log => {
            const decryptedLog = {...log};
            
            if (log.containsSensitiveData) {
                if (log.encryptedPreviousValue) {
                    decryptedLog.previousValue = simpleDecrypt(log.encryptedPreviousValue, userId);
                }
                
                if (log.encryptedNewValue) {
                    decryptedLog.newValue = simpleDecrypt(log.encryptedNewValue, userId);
                }
            }
            
            return decryptedLog;
        });
        
        return {
            success: true,
            logs: decryptedLogs
        };
    } catch (error: any) {
        console.error('Erro ao buscar logs de senha com dados sensíveis:', error);
        return {
            success: false,
            error: 'Erro ao buscar logs de senha',
            details: error.message
        };
    }
};
