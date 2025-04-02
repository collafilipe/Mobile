import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'http://172.20.10.3:5000';
const INITIAL_LOGS_LIMIT = 4; // Changed from 5 to 4 logs initially displayed

type PasswordLogItem = {
  id: string;
  passwordId: string;
  passwordName: string;
  actionType: 'create' | 'update' | 'delete';
  timestamp: string;
  fieldChanged?: string;
  previousValue?: string;
  newValue?: string;
  containsSensitiveData?: boolean;
};

type LoginIpItem = {
  id: string;
  ipAddress: string;
  deviceInfo: string;
  location?: string;
  isTrusted: boolean;
  firstSeen: string;
  lastSeen: string;
};

const SecurityScreen = () => {
  const { user } = useAuth();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [passwordLogs, setPasswordLogs] = useState<PasswordLogItem[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<PasswordLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showingSensitiveData, setShowingSensitiveData] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [userPassword, setUserPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [loginIps, setLoginIps] = useState<LoginIpItem[]>([]);
  const [ipsLoading, setIpsLoading] = useState(false);
  const [updatingIpId, setUpdatingIpId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.usuarioID) {
      fetchUserSettings();
      fetchPasswordLogs();
      fetchLoginIps();
    }
  }, [user]);

  // Update displayed logs whenever the full list changes or showAllLogs changes
  useEffect(() => {
    if (showAllLogs) {
      setDisplayedLogs(passwordLogs);
    } else {
      setDisplayedLogs(passwordLogs.slice(0, INITIAL_LOGS_LIMIT));
    }
  }, [passwordLogs, showAllLogs]);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/${user?.usuarioID}`);
      if (response.data && response.data.user) {
        setPinEnabled(response.data.user.pinEnabled || false);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswordLogs = async () => {
    try {
      setLogsLoading(true);
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/api/password-logs/${user?.usuarioID}`);
      if (response.data && response.data.logs) {
        setPasswordLogs(response.data.logs);
        // Reset to only showing initial limit when refreshing
        setShowAllLogs(false);
        setShowingSensitiveData(false); // Reset sensitive data flag when fetching regular logs
      }
    } catch (error) {
      console.error('Erro ao buscar logs de senhas:', error);
    } finally {
      setLogsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSensitivePasswordLogs = async () => {
    if (!userPassword) {
      Alert.alert('Erro', 'Por favor, insira sua senha');
      return;
    }

    try {
      setVerifyingPassword(true);
      const response = await axios.post(
        `${API_URL}/api/password-logs/${user?.usuarioID}/sensitive`, 
        { password: userPassword }
      );
      
      if (response.data && response.data.success) {
        setPasswordLogs(response.data.logs);
        setShowingSensitiveData(true);
        setPasswordModalVisible(false);
        setUserPassword('');
      } else {
        Alert.alert('Erro', response.data?.error || 'Senha incorreta');
      }
    } catch (error: any) {
      console.error('Erro ao buscar logs sensíveis:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Falha ao verificar senha'
      );
    } finally {
      setVerifyingPassword(false);
    }
  };

  const fetchLoginIps = async () => {
    try {
      setIpsLoading(true);
      const response = await axios.get(`${API_URL}/api/login-ips/${user?.usuarioID}`);
      if (response.data && response.data.success) {
        setLoginIps(response.data.ips);
      }
    } catch (error) {
      console.error('Erro ao buscar IPs de login:', error);
    } finally {
      setIpsLoading(false);
    }
  };

  const handleTogglePin = async (value: boolean) => {
    try {
      setSaveLoading(true);
      const response = await axios.put(`${API_URL}/api/users/${user?.usuarioID}/pin`, {
        pinEnabled: value,
      });

      if (response.data.success) {
        setPinEnabled(value);
      } else {
        // Reverte a mudança em caso de erro
        setPinEnabled(!value);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração de PIN:', error);
      // Reverte a mudança em caso de erro
      setPinEnabled(!value);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleIpTrust = async (ipId: string, isTrusted: boolean) => {
    try {
      setUpdatingIpId(ipId);
      const response = await axios.put(
        `${API_URL}/api/login-ips/${user?.usuarioID}/${ipId}`,
        { isTrusted }
      );
      
      if (response.data && response.data.success) {
        // Update local state to reflect the change
        setLoginIps(prev => 
          prev.map(ip => ip.id === ipId ? { ...ip, isTrusted } : ip)
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar confiabilidade do IP:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status do IP');
    } finally {
      setUpdatingIpId(null);
    }
  };

  const handleViewSensitiveData = () => {
    if (showingSensitiveData) {
      // If already showing sensitive data, switch back to regular view
      fetchPasswordLogs();
    } else {
      // Show password verification modal
      setPasswordModalVisible(true);
    }
  };

  const handleShowMoreLogs = () => {
    setShowAllLogs(true);
  };

  const handleClearLogs = async () => {
    try {
      const response = await axios.delete(`${API_URL}/api/password-logs/${user?.usuarioID}`);
      if (response.data && response.data.success) {
        fetchPasswordLogs();
        Alert.alert('Sucesso', 'Histórico limpo com sucesso!');
      } else {
        Alert.alert('Erro', 'Falha ao limpar histórico');
      }
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      Alert.alert('Erro', 'Não foi possível limpar o histórico');
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'create': return 'Criação';
      case 'update': return 'Atualização';
      case 'delete': return 'Exclusão';
      default: return type;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'create': return 'add-circle-outline';
      case 'update': return 'create-outline';
      case 'delete': return 'trash-outline';
      default: return 'help-circle-outline';
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'create': return '#4CAF50';
      case 'update': return '#2196F3';
      case 'delete': return '#F44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const renderLogItem = ({ item }: { item: PasswordLogItem }) => (
    <View style={styles.logItem}>
      <View style={[styles.logIconContainer, { backgroundColor: getActionTypeColor(item.actionType) }]}>
        <Ionicons name={getActionTypeIcon(item.actionType) as any} size={18} color="#fff" />
      </View>
      <View style={styles.logContent}>
        <Text style={styles.logTitle}>{item.passwordName}</Text>
        <Text style={styles.logAction}>
          {getActionTypeLabel(item.actionType)}
          {item.fieldChanged && <Text style={styles.fieldName}> ({getFieldLabel(item.fieldChanged)})</Text>}
        </Text>
        
        {item.actionType === 'update' && item.previousValue && item.newValue && (
          <Text style={styles.changeDetails}>
            <Text style={styles.previousValue}>{item.previousValue}</Text>
            <Text style={styles.changeArrow}> → </Text>
            <Text style={styles.newValue}>{item.newValue}</Text>
          </Text>
        )}
        
        {item.actionType === 'create' && item.newValue && (
          <Text style={styles.changeDetails}>
            <Text style={styles.newValue}>Criado: {item.newValue}</Text>
          </Text>
        )}
        
        {item.actionType === 'delete' && item.previousValue && (
          <Text style={styles.changeDetails}>
            <Text style={styles.previousValue}>Excluído: {item.previousValue}</Text>
          </Text>
        )}
        
        <Text style={styles.logTime}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );

  const renderLoginIpItem = ({ item }: { item: LoginIpItem }) => {
    const isUpdating = updatingIpId === item.id;
    
    return (
      <View style={styles.ipItem}>
        <View style={styles.ipMainInfo}>
          <Text style={styles.ipAddress}>{item.ipAddress}</Text>
          <View style={[
            styles.trustBadge, 
            item.isTrusted ? styles.trustedBadge : styles.untrustedBadge
          ]}>
            <Text style={styles.trustBadgeText}>
              {item.isTrusted ? 'Confiável' : 'Não confiável'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.ipDevice}>{item.deviceInfo || 'Dispositivo desconhecido'}</Text>
        
        <View style={styles.ipTimeInfo}>
          <Text style={styles.ipTimeLabel}>Primeiro acesso:</Text>
          <Text style={styles.ipTimeValue}>{format(new Date(item.firstSeen), 'dd/MM/yyyy HH:mm')}</Text>
        </View>
        
        <View style={styles.ipTimeInfo}>
          <Text style={styles.ipTimeLabel}>Último acesso:</Text>
          <Text style={styles.ipTimeValue}>
            {formatDistance(new Date(item.lastSeen), new Date(), { addSuffix: true, locale: ptBR })}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.ipTrustButton, item.isTrusted ? styles.untrust : styles.trust]}
          onPress={() => handleToggleIpTrust(item.id, !item.isTrusted)}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons 
                name={item.isTrusted ? "close-circle-outline" : "checkmark-circle-outline"} 
                size={16} 
                color="#fff" 
                style={styles.ipTrustButtonIcon} 
              />
              <Text style={styles.ipTrustButtonText}>
                {item.isTrusted ? 'Remover confiança' : 'Marcar como confiável'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const getFieldLabel = (fieldName: string) => {
    switch (fieldName) {
      case 'name': return 'Nome';
      case 'password': return 'Senha';
      case 'favorite': return 'Favorito';
      default: return fieldName;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autenticação</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Usar PIN/Biometria</Text>
              <Text style={styles.settingDescription}>
                Ative para fazer login com PIN, padrão ou biometria
              </Text>
            </View>
            <Switch
              value={pinEnabled}
              onValueChange={handleTogglePin}
              disabled={saveLoading}
              trackColor={{ false: '#ccc', true: '#4285F4' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico de Alterações</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchPasswordLogs}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh-outline" 
                size={22} 
                color={refreshing ? '#ccc' : '#4285F4'} 
              />
            </TouchableOpacity>
          </View>
          
          {logsLoading ? (
            <View style={styles.logsLoadingContainer}>
              <ActivityIndicator size="small" color="#4285F4" />
              <Text style={styles.logsLoadingText}>Carregando histórico...</Text>
            </View>
          ) : passwordLogs.length > 0 ? (
            <>
              <FlatList
                data={displayedLogs}
                renderItem={renderLogItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.logsList}
              />
              
              {passwordLogs.length > displayedLogs.length && !showAllLogs && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={handleShowMoreLogs}
                >
                  <Text style={styles.showMoreText}>
                    Ver mais ({passwordLogs.length - displayedLogs.length} restantes)
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.sensitiveDataButton,
                  styles.sensitiveDataButtonFull,  
                  showingSensitiveData && styles.sensitiveDataActiveButton
                ]}
                onPress={handleViewSensitiveData}
              >
                <Ionicons 
                  name={showingSensitiveData ? "eye-off-outline" : "eye-outline"} 
                  size={18} 
                  color={showingSensitiveData ? "#fff" : "#4285F4"} 
                />
                <Text style={[
                  styles.sensitiveDataButtonText,
                  showingSensitiveData && styles.sensitiveDataActiveButtonText
                ]}>
                  {showingSensitiveData ? "Ocultar valores reais" : "Ver valores reais"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyLogsContainer}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyLogsText}>Nenhum registro de alteração encontrado</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispositivos e Locais de Acesso</Text>
          
          {ipsLoading ? (
            <View style={styles.logsLoadingContainer}>
              <ActivityIndicator size="small" color="#4285F4" />
              <Text style={styles.logsLoadingText}>Carregando dispositivos...</Text>
            </View>
          ) : loginIps.length > 0 ? (
            <FlatList
              data={loginIps}
              renderItem={renderLoginIpItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.ipsList}
            />
          ) : (
            <View style={styles.emptyLogsContainer}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.emptyLogsText}>Nenhum local de acesso registrado</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opções Avançadas</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#333" style={styles.actionIcon} />
            <Text style={styles.actionText}>Avaliar Segurança das Senhas</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Limpar Histórico',
                'Tem certeza que deseja limpar todo o histórico de alterações?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Limpar', 
                    style: 'destructive',
                    onPress: handleClearLogs
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#f44336" style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: '#f44336' }]}>Limpar Histórico</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password verification modal */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verificação de Segurança</Text>
            <Text style={styles.modalDescription}>
              Digite sua senha para visualizar os valores reais das senhas
            </Text>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Sua senha"
                secureTextEntry={!showPassword}
                value={userPassword}
                onChangeText={setUserPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setUserPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, !userPassword && styles.disabledButton]}
                onPress={fetchSensitivePasswordLogs}
                disabled={!userPassword || verifyingPassword}
              >
                {verifyingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Verificar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 2, // Reduced top padding to minimize space from header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  logsList: {
    marginTop: 8,
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logAction: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyLogsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyLogsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  logsLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  logsLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  changeDetails: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  previousValue: {
    color: '#F44336',
    fontStyle: 'italic',
  },
  newValue: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  changeArrow: {
    color: '#757575',
  },
  fieldName: {
    fontStyle: 'italic',
    color: '#757575',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
  },
  showMoreButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  showMoreText: {
    color: '#4285F4',
    fontWeight: '600',
    fontSize: 14,
  },
  sensitiveDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4285F4',
    backgroundColor: 'transparent',
  },
  sensitiveDataButtonFull: {
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 16,
  },
  sensitiveDataActiveButton: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  sensitiveDataButtonText: {
    fontSize: 12,
    color: '#4285F4',
    marginLeft: 4,
  },
  sensitiveDataActiveButtonText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  ipsList: {
    marginTop: 8,
  },
  ipItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  ipMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ipAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trustBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trustedBadge: {
    backgroundColor: '#E8F5E9',
  },
  untrustedBadge: {
    backgroundColor: '#FFEBEE',
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ipDevice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ipTimeInfo: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ipTimeLabel: {
    fontSize: 12,
    color: '#888',
    width: 100,
  },
  ipTimeValue: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  ipTrustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  trust: {
    backgroundColor: '#4CAF50',
  },
  untrust: {
    backgroundColor: '#F44336',
  },
  ipTrustButtonIcon: {
    marginRight: 6,
  },
  ipTrustButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SecurityScreen;