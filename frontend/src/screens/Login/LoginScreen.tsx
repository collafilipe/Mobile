import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { AuthMethod } from '../../utils/biometricAuth';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    login,
    loginWithAuth,
    hasFingerprint,
    hasFacialRecognition,
    hasDevicePasscode,
    preferredAuthMethod,
  } = useAuth();

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

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);

      if (!success) {
        Alert.alert('Erro', 'Usuário ou senha inválidos');
      }

      // Se o login for bem-sucedido, o AppNavigator cuida da navegação!
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro durante o login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthLogin = async (method: AuthMethod) => {
    setIsLoading(true);

    try {
      const success = await loginWithAuth(method);

      if (!success) {
        Alert.alert('Erro', `Falha na autenticação por ${getAuthMethodName(method).toLowerCase()}`);
      }

      // Se o login for bem-sucedido, o AppNavigator cuida da navegação!
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro de conexão ou resposta inesperada. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  const getAuthMethodName = (method: AuthMethod): string => {
    switch (method) {
      case 'biometric': return 'Biometria';
      case 'facial': return 'Reconhecimento Facial';
      case 'device_passcode': return 'PIN/Padrão';
      case 'none': return 'Senha';
      default: return 'Desconhecido';
    }
  };

  const getAuthMethodIcon = (method: AuthMethod): keyof typeof Ionicons.glyphMap => {
    switch (method) {
      case 'biometric': return 'finger-print-outline';
      case 'facial': return 'scan-outline';
      case 'device_passcode': return 'keypad-outline';
      case 'none': return 'lock-closed-outline';
      default: return 'help-outline';
    }
  };

  const availableAuthMethods: AuthMethod[] = useMemo(() => {
    const methods: AuthMethod[] = ['none'];

    if (hasFingerprint) methods.push('biometric');
    if (hasFacialRecognition) methods.push('facial');
    if (hasDevicePasscode) methods.push('device_passcode');

    return methods;
  }, [hasFingerprint, hasFacialRecognition, hasDevicePasscode]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Gerenciador de Senhas</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#4285F4" style={styles.loader} />
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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
              <Text style={styles.buttonText}>Entrar com Senha</Text>
            </TouchableOpacity>

            {availableAuthMethods.length > 1 && (
              <View style={styles.authMethodsContainer}>
                <Text style={styles.authMethodsTitle}>Ou entre com:</Text>
                <View style={styles.authMethodsButtons}>
                  {availableAuthMethods.map((method) => (
                    method !== 'none' && (
                      <TouchableOpacity
                        key={method}
                        style={styles.authMethodButton}
                        onPress={() => handleAuthLogin(method)}
                      >
                        <Ionicons
                          name={getAuthMethodIcon(method)}
                          size={24}
                          color="#4285F4"
                        />
                        <Text style={styles.authMethodButtonText}>
                          {getAuthMethodName(method)}
                        </Text>
                      </TouchableOpacity>
                    )
                  ))}
                </View>
              </View>
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
