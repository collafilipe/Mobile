import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';

const API_URL = 'http://192.168.0.109:5000';

const SecurityScreen = () => {
  const { user } = useAuth();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.usuarioID) {
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/${user?.usuarioID}`);
      if (response.data.success) {
        setPinEnabled(response.data.user.pinEnabled);
      }
    } catch (error) {
      Alert.alert('Atenção', 'Erro ao carregar configurações');
    }
  };

  const handlePinToggle = async () => {
    try {
      setLoading(true);
      // Verifica se o dispositivo suporta autenticação biométrica
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Atenção', 'Seu dispositivo não suporta autenticação biométrica');
        return;
      }

      // Verifica se há autenticação biométrica configurada
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Atenção', 'Nenhuma autenticação biométrica configurada');
        return;
      }

      // Se estiver desabilitando, apenas atualiza
      if (pinEnabled) {
        const response = await axios.put(`${API_URL}/api/users/${user?.usuarioID}/pin`, {
          pinEnabled: false,
        });

        if (response.data.success) {
          setPinEnabled(false);
          Alert.alert('Sucesso', 'Login com PIN desativado');
        } else {
          Alert.alert('Atenção', 'Erro ao desativar login com PIN');
        }
        return;
      }

      // Se estiver habilitando, verifica autenticação primeiro
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para habilitar login com PIN',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        const response = await axios.put(`${API_URL}/api/users/${user?.usuarioID}/pin`, {
          pinEnabled: true,
        });

        if (response.data.success) {
          setPinEnabled(true);
          Alert.alert('Sucesso', 'Login com PIN ativado');
        } else {
          Alert.alert('Atenção', 'Erro ao ativar login com PIN');
        }
      }
    } catch (error) {
      Alert.alert('Atenção', 'Erro ao alterar configuração de PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autenticação</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Login com PIN</Text>
              <Text style={styles.settingDescription}>
                Use a autenticação biométrica do seu dispositivo para fazer login
              </Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
              disabled={loading}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={pinEnabled ? '#4285F4' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidade</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-outline" size={24} color="#333" style={styles.menuIcon} />
            <Text style={styles.menuText}>Política de Privacidade</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={24} color="#333" style={styles.menuIcon} />
            <Text style={styles.menuText}>Termos de Uso</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 10,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 15,
    marginBottom: 10,
    marginTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SecurityScreen; 