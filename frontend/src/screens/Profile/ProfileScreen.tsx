import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView, Animated, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';

const API_URL = 'http://172.20.10.3:5000';

const ProfileScreen = () => {
  const [showAuthMethodModal, setShowAuthMethodModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null); // Para armazenar os dados completos do usuário
  const { user, logout } = useAuth();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [pinEnabled, setPinEnabled] = useState(false);

  // Função para buscar os dados do usuário
  const fetchUserDataFromBackend = async (userId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/${userId}`);
      
      if (response.data.success) {
        setUserData(response.data.user);
      } else {
        console.error('Erro ao buscar dados:', response.data.error);
        setUserData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Usando useEffect para chamar a função de fetch assim que o componente for montado
  useEffect(() => {
    if (user?.usuarioID) {
      fetchUserDataFromBackend(user.usuarioID);
    }
  }, [user]);

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
    }
  };

  // Função para logout
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim', onPress: () => logout() },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userData?.nome ? userData.nome.charAt(0).toUpperCase() : ''}
            </Text>
          </View>

          <Text style={styles.username}>
            {userData?.nome}  {/* Exibe o nome carregado */}
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color="#4285F4" style={{ marginTop: 10 }} />
          ) : (
            userData && (
              <>
                <Text style={styles.userInfo}>Email: {userData.email}</Text>
              </>
            )
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={24} color="#333" style={styles.menuIcon} />
            <Text style={styles.menuText}>Alterar Senha</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-outline" size={24} color="#333" style={styles.menuIcon} />
            <Text style={styles.menuText}>Segurança</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

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
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={pinEnabled ? '#4285F4' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4285F4', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  userInfo: { fontSize: 14, color: '#666', marginTop: 5 },
  section: { backgroundColor: '#fff', marginTop: 20, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginLeft: 15, marginBottom: 10, marginTop: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuIcon: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF3B30', marginHorizontal: 20, marginTop: 30, padding: 15, borderRadius: 8 },
  logoutIcon: { marginRight: 10 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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

export default ProfileScreen;
