import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { AuthMethod } from '../utils/biometricAuth';
import * as LocalAuthentication from 'expo-local-authentication';

type User = {
  usuarioID: string;
  nome: string;
  email: string;
  pinEnabled?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithPin: (email: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginWithAuth: (method: AuthMethod) => Promise<boolean>;
  hasFingerprint: boolean;
  hasFacialRecognition: boolean;
  hasDevicePasscode: boolean;
  preferredAuthMethod: AuthMethod;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

const API_URL = 'http://172.20.10.3:5000'; // Coloque o IP correto

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasFingerprint, setHasFingerprint] = useState<boolean>(false);
  const [hasFacialRecognition, setHasFacialRecognition] = useState<boolean>(false);
  const [hasDevicePasscode, setHasDevicePasscode] = useState<boolean>(false);
  const [preferredAuthMethod, setPreferredAuthMethod] = useState<AuthMethod>('none');

  useEffect(() => {
    const loadStoredUser = async () => {
      setIsLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem('@auth_user');
        const storedToken = await AsyncStorage.getItem('@auth_token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        setHasFingerprint(types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT));
        setHasFacialRecognition(types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION));
        setHasDevicePasscode(await LocalAuthentication.isEnrolledAsync());
        
        // Set preferred method based on availability
        if (hasFacialRecognition) setPreferredAuthMethod('facial');
        else if (hasFingerprint) setPreferredAuthMethod('biometric');
        else if (hasDevicePasscode) setPreferredAuthMethod('device_passcode');
        else setPreferredAuthMethod('none');
      } catch (error) {
        console.error('Error checking biometric support:', error);
      }
    };

    checkBiometricSupport();
  }, []);

  const fetchUserData = async (usuarioID: string) => {
    try {
      const userResponse = await axios.get(`${API_URL}/api/users/${usuarioID}`);
      if (userResponse.data.success) {
        const userData = userResponse.data.user;
        await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
    return null;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Make a single call to the login API
      console.log('Attempting login for:', email);
      const response = await axios.post(`${API_URL}/api/users/login`, {
        email,
        senha: password
      });

      console.log('Login response received:', response.data.success);
      
      if (response.data.success) {
        const userData = await fetchUserData(response.data.usuarioID);
        
        if (userData) {
          const token = response.data.token;
          await AsyncStorage.setItem('@auth_token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Salva o email como último acessado
          await AsyncStorage.setItem('@last_email', email);

          // Atualiza o histórico de emails
          const savedEmails = await AsyncStorage.getItem('@saved_emails');
          let emails = savedEmails ? JSON.parse(savedEmails) : [];
          if (!emails.includes(email)) {
            emails.push(email);
            await AsyncStorage.setItem('@saved_emails', JSON.stringify(emails));
          }

          return true;
        }
      }
      
      // If we get here, login failed
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPin = async (email: string, token: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem('@auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Busca os dados do usuário usando o email
      const userResponse = await axios.get(`${API_URL}/api/users/email/${email}`);
      if (userResponse.data.success) {
        const userData = userResponse.data.user;
        await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
        setUser(userData);

        // Salva o email como último acessado
        await AsyncStorage.setItem('@last_email', email);

        // Atualiza o histórico de emails
        const savedEmails = await AsyncStorage.getItem('@saved_emails');
        let emails = savedEmails ? JSON.parse(savedEmails) : [];
        if (!emails.includes(email)) {
          emails.push(email);
          await AsyncStorage.setItem('@saved_emails', JSON.stringify(emails));
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login com PIN:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Salva o email atual antes de fazer logout
      if (user?.email) {
        const savedEmails = await AsyncStorage.getItem('@saved_emails');
        let emails = savedEmails ? JSON.parse(savedEmails) : [];
        if (!emails.includes(user.email)) {
          emails.push(user.email);
          await AsyncStorage.setItem('@saved_emails', JSON.stringify(emails));
        }
      }
      await AsyncStorage.removeItem('@auth_user');
      await AsyncStorage.removeItem('@auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithAuth = async (method: AuthMethod): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para continuar',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        // Handle successful authentication
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during authentication:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login,
      loginWithPin,
      logout,
      loginWithAuth,
      hasFingerprint,
      hasFacialRecognition,
      hasDevicePasscode,
      preferredAuthMethod
    }}>
      {children}
    </AuthContext.Provider>
  );
};
