import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, AppState } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { AuthMethod } from '../../utils/biometricAuth';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const API_URL = 'http://172.20.10.3:5000';

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [appState, setAppState] = useState<'active' | 'background' | 'inactive' | 'unknown' | 'extension'>(AppState.currentState);

  const {
    login,
    loginWithPin,
    loginWithAuth,
    hasFingerprint,
    hasFacialRecognition,
    hasDevicePasscode,
    preferredAuthMethod,
  } = useAuth();

  // Carrega os emails salvos
  useEffect(() => {
    const loadSavedEmails = async () => {
      // Primeiro carrega o último email acessado
      const lastEmail = await AsyncStorage.getItem('@last_email');
      if (lastEmail) {
        setUsername(lastEmail);
        // Verifica se o PIN está habilitado para o último email
        try {
          const response = await axios.post(`${API_URL}/api/users/pin-login`, {
            email: lastEmail,
          });
          setPinEnabled(response.data.success);
        } catch (error) {
          setPinEnabled(false);
        }
      }
    };
    loadSavedEmails();
  }, []);

  // Verifica se o usuário tem PIN habilitado
  useEffect(() => {
    const checkPinEnabled = async () => {
      if (!username) return;
      
      try {
        // Primeiro verifica se este é o último email acessado
        const lastEmail = await AsyncStorage.getItem('@last_email');
        if (lastEmail !== username) {
          setPinEnabled(false);
          return;
        }

        const response = await axios.post(`${API_URL}/api/users/pin-login`, {
          email: username,
        });
        
        setPinEnabled(response.data.success);
      } catch (error: any) {
        setPinEnabled(false);
      }
    };

    // Adiciona um pequeno delay para evitar chamadas desnecessárias
    const timeoutId = setTimeout(() => {
      if (username) {
        checkPinEnabled();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (preferredAuthMethod !== 'none') {
        setIsLoading(true);
        try {
          await loginWithAuth(preferredAuthMethod);
        } catch (error) {
          // Silencia o erro no login automático
          // console.error('Erro ao tentar login automático:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
  
    attemptAutoLogin();
  }, [preferredAuthMethod, loginWithAuth]);  

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: 'active' | 'background' | 'inactive' | 'unknown' | 'extension') => {
    if (appState === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
      // Limpa a senha quando o app vai para background
      setPassword('');
    }
    setAppState(nextAppState);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      Alert.alert('Atenção', 'Por favor, insira um email válido!');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/users/login`, {
        email: username,
        senha: password,
      });

      if (response.data.success) {
        await login(username, password);
        // Salva o email no histórico
        const savedEmails = await AsyncStorage.getItem('@saved_emails');
        let emails = savedEmails ? JSON.parse(savedEmails) : [];
        if (!emails.includes(username)) {
          emails.push(username);
          await AsyncStorage.setItem('@saved_emails', JSON.stringify(emails));
        }
      } else {
        Alert.alert('Atenção', response.data.error || 'Erro ao fazer login');
      }
    } catch (error: any) {
      Alert.alert('Atenção', error.response?.data?.error || 'Erro ao fazer login');
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  const handlePinLogin = async () => {
    try {
      // Carrega o último email acessado
      const lastEmail = await AsyncStorage.getItem('@last_email');
      if (!lastEmail) {
        Alert.alert('Atenção', 'Você precisa fazer login com senha pelo menos uma vez antes de usar o PIN');
        return;
      }

      // Verifica se o PIN está habilitado para o último email
      const response = await axios.post(`${API_URL}/api/users/pin-login`, {
        email: lastEmail,
      });

      if (response.data.success) {
        // Se o PIN está habilitado, tenta autenticar
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Autentique-se para fazer login',
          fallbackLabel: 'Usar senha',
        });
        
        if (authResult.success) {
          setUsername(lastEmail);
          const success = await loginWithPin(lastEmail, response.data.token);
          if (!success) {
            Alert.alert('Erro', 'Não foi possível fazer login com PIN. Tente novamente.');
          }
        }
      } else {
        Alert.alert('Atenção', 'Login com PIN não está habilitado para esta conta. Faça login com senha primeiro.');
      }
    } catch (error: any) {
      console.error('Erro no login com PIN:', error);
      if (error.response?.status === 500) {
        Alert.alert('Erro', 'Erro ao verificar PIN. Tente novamente.');
      } else {
        Alert.alert('Atenção', 'Login com PIN não está habilitado para esta conta. Faça login com senha primeiro.');
      }
    }
  };

  // Carrega o último email usado
  useEffect(() => {
    const loadLastEmail = async () => {
      const lastEmail = await AsyncStorage.getItem('@last_email');
      if (lastEmail) {
        setUsername(lastEmail);
      }
    };
    loadLastEmail();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Gerenciador de Senhas</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#4285F4" style={styles.loader} />
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            {pinEnabled && (
              <TouchableOpacity
                style={styles.pinButton}
                onPress={handlePinLogin}
              >
                <Ionicons
                  name="keypad-outline"
                  size={24}
                  color="#4285F4"
                  style={styles.pinButtonIcon}
                />
                <Text style={styles.pinButtonText}>PIN/Padrão</Text>
              </TouchableOpacity>
            )}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Não tem uma conta?</Text>
              <TouchableOpacity onPress={goToRegister}>
                <Text style={styles.registerLink}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pinButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  pinButtonIcon: {
    marginRight: 10,
  },
  pinButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authMethodsContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  authMethodsTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  authMethodsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  authMethodButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  authMethodButtonText: {
    color: '#4285F4',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#4285F4',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  loader: {
    marginTop: 20,
  },
});

export default LoginScreen;
