import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/AppNavigator';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { generateStrongPassword } from '../../utils/passwordGenerator';

type ForgotPasswordProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ForgotPassword'>;

const API_URL = 'http://172.20.10.3:5000';

const ForgotPasswordProfileScreen = () => {
  const navigation = useNavigation<ForgotPasswordProfileScreenNavigationProp>();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Atenção', 'Todos os campos são obrigatórios');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Atenção', 'As novas senhas não coincidem');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Atenção', 'A nova senha não pode ser igual à senha atual');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('');
      setIsSuccess(false);
      
      // First verify current password
      const verifyResponse = await axios.post(`${API_URL}/api/passwords/verify-password`, {
        userId: user?.usuarioID,
        password: currentPassword
      });
      
      if (!verifyResponse.data.success) {
        setStatusMessage('Senha atual incorreta');
        Alert.alert('Erro', 'Senha atual incorreta');
        return;
      }
      
      // Then update password
      const response = await axios.put(`${API_URL}/api/users/alterar-usuario/${user?.usuarioID}`, {
        nome: user?.nome,
        email: user?.email,
        senha: newPassword,
      });

      if (response.data.success) {
        setIsSuccess(true);
        setStatusMessage('Senha alterada com sucesso!');
        
        Alert.alert(
          'Sucesso',
          'Sua senha foi alterada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMessage(response.data.error || 'Erro ao alterar senha');
        Alert.alert('Erro', response.data.error || 'Erro ao alterar senha');
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setStatusMessage(error.response?.data?.error || 'Erro ao alterar senha');
      Alert.alert('Erro', 'Não foi possível alterar sua senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const password = generateStrongPassword();
    setNewPassword(password);
    setConfirmPassword(password);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Alterar Senha</Text>
        <Text style={styles.subtitle}>
          Preencha os campos abaixo para alterar sua senha
        </Text>

        {statusMessage ? (
          <View style={[
            styles.statusContainer, 
            isSuccess ? styles.successContainer : styles.errorContainer
          ]}>
            <Ionicons 
              name={isSuccess ? 'checkmark-circle' : 'alert-circle'} 
              size={24} 
              color={isSuccess ? '#4CAF50' : '#F44336'} 
              style={styles.statusIcon}
            />
            <Text style={[
              styles.statusText,
              isSuccess ? styles.successText : styles.errorText
            ]}>
              {statusMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha atual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nova senha"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
            />
            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={styles.generateIcon}
                onPress={handleGeneratePassword}
              >
                <Ionicons
                  name="key-outline"
                  size={20}
                  color="#4285F4"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
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
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Alterar Senha</Text>
            )}
          </TouchableOpacity>
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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

export default ForgotPasswordProfileScreen;