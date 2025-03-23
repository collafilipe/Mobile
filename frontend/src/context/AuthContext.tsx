import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

type User = {
  id: string;
  nome: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

const API_URL = 'http://172.20.10.3:5000/api/users/login'; // Coloque o IP correto

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        email,
        senha: password,
      });

      if (response.status !== 200 || !response.data.success) {
        Alert.alert('Erro', 'Usuário ou senha inválidos');
        return false;
      }

      const token = response.data.token;

      if (!token) {
        Alert.alert('Erro', 'Token não recebido.');
        return false;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));

      const userData: User = {
        id: payload.usuarioID,
        nome: payload.nome || 'Usuário',
        email: email,
      };

      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await AsyncStorage.setItem('@auth_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@auth_token', token);

      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Erro ao fazer login. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
