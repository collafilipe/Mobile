import * as CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Chave para o AsyncStorage
const ENCRYPTION_KEY_STORAGE = '@PasswordManager:encryptionKey';

/**
 * Gera uma chave de criptografia aleatória ou recupera a existente
 */
export const getEncryptionKey = async (): Promise<string> => {
  try {
    // Tentar recuperar a chave existente
    const storedKey = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE);
    
    if (storedKey) {
      return storedKey;
    }
    
    // Se não existir, gerar uma nova chave
    const newKey = uuidv4() + uuidv4(); // Chave longa e aleatória
    await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE, newKey);
    return newKey;
  } catch (error) {
    console.error('Erro ao obter chave de criptografia:', error);
    // Em caso de erro, retornar uma chave temporária
    // Isso não é ideal para produção, mas evita falhas catastróficas
    return 'temporary_key_' + Date.now();
  }
};

/**
 * Criptografa uma string
 */
export const encrypt = async (text: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha ao criptografar dados');
  }
};

/**
 * Descriptografa uma string
 */
export const decrypt = async (encryptedText: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha ao descriptografar dados');
  }
};

/**
 * Criptografa um objeto
 */
export const encryptObject = async <T>(obj: T): Promise<string> => {
  try {
    const jsonString = JSON.stringify(obj);
    return await encrypt(jsonString);
  } catch (error) {
    console.error('Erro ao criptografar objeto:', error);
    throw new Error('Falha ao criptografar objeto');
  }
};

/**
 * Descriptografa um objeto
 */
export const decryptObject = async <T>(encryptedText: string): Promise<T> => {
  try {
    const jsonString = await decrypt(encryptedText);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Erro ao descriptografar objeto:', error);
    throw new Error('Falha ao descriptografar objeto');
  }
}; 