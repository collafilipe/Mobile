import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import axios from 'axios';
import { generateStrongPassword } from '../../utils/passwordGenerator';

type ResetPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;

type ResetPasswordRouteParams = {
  token: string;
};

const API_URL = 'http://172.20.10.3:5000';

const ResetPasswordScreen = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Get token from route params or URL
    const params = route.params as ResetPasswordRouteParams;
    console.log('Route params:', params);
    
    if (params?.token) {
      console.log('Token from params:', params.token);
      setToken(params.token);
    } else {
      // Try to extract token from URL if not in params
      const url = window.location?.href;
      if (url && url.includes('reset-password')) {
        const tokenFromUrl = url.split('/').pop();
        if (tokenFromUrl) {
          console.log('Token from URL:', tokenFromUrl);
          setToken(tokenFromUrl);
        }
      }
    }
  }, [route]);

  // If success status, navigate to login after a delay
  useEffect(() => {
    if (resetStatus === 'success') {
      const timer = setTimeout(() => {
        navigation.navigate('Login');
      }, 3000); // Navigate after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [resetStatus, navigation]);

  const handleResetPassword = async () => {
    if (!token) {
      setResetStatus('error');
      setStatusMessage('Token de redefinição inválido ou expirado');
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      setResetStatus('idle');
      setStatusMessage('');
      
      const response = await axios.put(`${API_URL}/api/users/redefinir-senha/${token}/${password}`);

      if (response.data && response.data.success) {
        // Show success UI
        setResetStatus('success');
        setStatusMessage('Senha redefinida com sucesso! Redirecionando para o login...');
        
        // Alert also shown for additional feedback
        Alert.alert(
          'Sucesso',
          'Sua senha foi redefinida com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
          { cancelable: false }
        );
      } else {
        setResetStatus('error');
        setStatusMessage(response.data?.error || 'Não foi possível redefinir sua senha.');
        Alert.alert('Erro', 'Não foi possível redefinir sua senha. O token pode estar expirado.');
      }
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setResetStatus('error');
      setStatusMessage(error.response?.data?.error || 'Erro ao redefinir a senha. Tente novamente.');
      Alert.alert('Erro', 'Não foi possível redefinir sua senha. O token pode estar expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Text style={styles.title}>Link Inválido</Text>
          <Text style={styles.subtitle}>
            O link de redefinição de senha é inválido ou expirou.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Redefinir Senha</Text>
        <Text style={styles.subtitle}>
          Crie uma nova senha segura para sua conta
        </Text>

        {/* Status message display */}
        {resetStatus !== 'idle' && (
          <View style={[
            styles.statusContainer, 
            resetStatus === 'success' ? styles.successContainer : styles.errorContainer
          ]}>
            <Ionicons 
              name={resetStatus === 'success' ? 'checkmark-circle' : 'alert-circle'} 
              size={24} 
              color={resetStatus === 'success' ? '#4CAF50' : '#F44336'} 
              style={styles.statusIcon}
            />
            <Text style={[
              styles.statusText,
              resetStatus === 'success' ? styles.successText : styles.errorText
            ]}>
              {statusMessage}
            </Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nova senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={resetStatus !== 'success'} // Disable when success
            />
            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={styles.generateIcon}
                onPress={handleGeneratePassword}
                disabled={resetStatus === 'success'}
              >
                <Ionicons
                  name="key-outline"
                  size={20}
                  color={resetStatus === 'success' ? '#ccc' : '#4285F4'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={resetStatus === 'success'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={resetStatus === 'success' ? '#ccc' : '#666'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={resetStatus !== 'success'} // Disable when success
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={resetStatus === 'success'}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={resetStatus === 'success' ? '#ccc' : '#666'}
              />
            </TouchableOpacity>
          </View>

          {resetStatus === 'success' ? (
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonText}>Ir para Login</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.button, 
                loading && styles.buttonDisabled
              ]} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Redefinir Senha</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Lembrou sua senha?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Voltar ao Login</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
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
    height: 50,
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    height: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#4285F4',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateIcon: {
    padding: 10,
    marginLeft: 5,
  },
  statusContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  statusIcon: {
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
  },
  successText: {
    color: '#2E7D32',
  },
  errorText: {
    color: '#C62828',
  },
});

export default ResetPasswordScreen;
