import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import PasswordModal from '../../components/modals/passwordModal';

// IP constante para facilitar manutenção
const API_URL = 'http://172.20.10.3:5000';

type PasswordItem = {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  favorite: boolean;
  notes?: string;
};

const PasswordListScreen = () => {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<PasswordItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<PasswordItem | null>(null);

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [selectedItem, setSelectedItem] = useState<PasswordItem | null>(null);
  const [actionType, setActionType] = useState<'view' | 'copy' | 'edit' | 'delete' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Função para buscar as senhas do usuário
  const fetchPasswords = useCallback(async () => {
    if (!user?.usuarioID) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/passwords/${user.usuarioID}`);
      
      if (response.data && response.data.passwords) {
        const formattedPasswords = response.data.passwords.map((item: any) => ({
          id: item._id || item.id,
          title: item.name,
          username: item.email,
          password: '********',
          favorite: item.favorite || false,
          notes: item.notes || '',
        }));

        // Ordenar as senhas - favoritas primeiro
        const sortedPasswords = formattedPasswords.sort((a: PasswordItem, b: PasswordItem) => {
          // Se uma é favorita e outra não, a favorita vem primeiro
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          // Se ambas são favoritas ou ambas não são, ordena por título
          return a.title.localeCompare(b.title);
        });

        setPasswords(sortedPasswords);
      } else {
        setPasswords([]);
      }
    } catch (error) {
      // Silenciosamente falha - não mostra erro no console
      setPasswords([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carrega as senhas ao entrar na tela ou quando o usuário muda
  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  // Função para revelar a senha
  const revealPassword = async (item: PasswordItem) => {
    try {
      if (!user?.usuarioID) return;
      
      // Verifica se a senha já está visível e a esconde se estiver
      if (item.password !== '********') {
        const updatedPasswords = passwords.map((p) =>
          p.id === item.id ? { ...p, password: '********' } : p
        );
        setPasswords(updatedPasswords);
        return;
      }
      
      setLoading(true);
      // Usamos o ID da senha, com fallback para evitar undefined
      const passwordId = item.id || '';
      
      const response = await axios.get(`${API_URL}/api/passwords/${user.usuarioID}/${passwordId}`);
      
      if (response.data && response.data.password) {
        // Atualiza a senha na lista de senhas
        const updatedPasswords = passwords.map((p) =>
          p.id === item.id ? { ...p, password: response.data.password.password } : p
        );
        setPasswords(updatedPasswords);
      }
    } catch (error) {
      // Silenciosamente falha - não mostra erro no console
    } finally {
      setLoading(false);
    }
  };

  // Função para copiar a senha
  const copyPassword = async (item: PasswordItem) => {
    try {
      // Se a senha já estiver visível, copiamos diretamente
      if (item.password !== '********') {
        await Clipboard.setStringAsync(item.password);
        Alert.alert('Sucesso', 'Senha copiada para a área de transferência!');
        return;
      }
      
      if (!user?.usuarioID) return;
      
      setLoading(true);
      // Usamos o ID da senha, com fallback para evitar undefined
      const passwordId = item.id || '';
      
      const response = await axios.get(`${API_URL}/api/passwords/${user.usuarioID}/${passwordId}`);
      
      if (response.data && response.data.password) {
        await Clipboard.setStringAsync(response.data.password.password);
        Alert.alert('Sucesso', 'Senha copiada para a área de transferência!');
      }
    } catch (error) {
      // Silenciosamente falha - não mostra erro no console
      Alert.alert('Atenção', 'Não foi possível copiar a senha');
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir o modal de edição
  const handleEditPress = async (item: PasswordItem) => {
    setSelectedItem(item);
    setActionType('edit');
    setAuthModalVisible(true);
  };

  // Modal de autenticação para visualizar/copiar a senha
  const handleActionPress = (item: PasswordItem, type: 'view' | 'copy' | 'edit' | 'delete') => {
    // Se for para visualizar e a senha já estiver visível, apenas esconde
    if (type === 'view' && item.password !== '********') {
      revealPassword(item);
      return;
    }
    
    // Se for para copiar e a senha já estiver visível, copia diretamente
    if (type === 'copy' && item.password !== '********') {
      copyPassword(item);
      return;
    }
    
    // Não verificamos o ID aqui, essa verificação será feita na função que revela/copia a senha
    setSelectedItem(item);
    setActionType(type);
    setAuthModalVisible(true);
  };

  // Função para deletar a senha
  const handleDeletePassword = async () => {
    if (!user?.usuarioID || !selectedItem) return;

    try {
      const response = await axios.delete(`${API_URL}/api/passwords/${user.usuarioID}/${selectedItem.id}`);

      if (response.data.success) {
        fetchPasswords();
        setShowDeleteConfirm(false);
        Alert.alert('Sucesso', 'Senha excluída com sucesso!');
      } else {
        Alert.alert('Atenção', response.data.error || 'Erro ao excluir senha');
      }
    } catch (error) {
      Alert.alert('Atenção', 'Não foi possível excluir a senha. Tente novamente.');
    }
  };

  // Função para abrir o modal de confirmação de exclusão
  const handleDeletePress = (item: PasswordItem) => {
    setSelectedItem(item);
    setActionType('delete');
    setAuthModalVisible(true);
  };

  const handleAuthConfirm = async () => {
    if (!authPassword) {
      Alert.alert('Atenção', 'Digite sua senha para continuar.');
      return;
    }

    if (!user?.usuarioID || !selectedItem) {
      setAuthModalVisible(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/passwords/verify-password`, {
        userId: user.usuarioID,
        password: authPassword,
      });

      if (response.data.success) {
        setAuthModalVisible(false);
        setAuthPassword('');
        
        // Pequeno atraso para melhorar a experiência
        setTimeout(async () => {
          if (actionType === 'view') {
            await revealPassword(selectedItem);
          } else if (actionType === 'copy') {
            await copyPassword(selectedItem);
          } else if (actionType === 'edit') {
            setIsEditing(true);
            setEditingItem(selectedItem);
            setShowModal(true);
          } else if (actionType === 'delete') {
            setShowDeleteConfirm(true);
          }
        }, 300);
      } else {
        Alert.alert('Atenção', 'Senha incorreta!');
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Alert.alert('Atenção', 'Senha incorreta!');
      } else {
        Alert.alert('Atenção', 'Não foi possível verificar sua senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Funções de controle de Modal
  const openModal = () => {
    setIsEditing(false);
    setEditingItem(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingItem(null);
  };

  const renderItem = ({ item }: { item: PasswordItem }) => {
    const isPasswordVisible = item.password !== '********';
    
    return (
      <View style={styles.passwordItem}>
        <View style={styles.passwordInfo}>
          <Text style={styles.passwordTitle}>{item.title}</Text>
          <Text style={styles.passwordUsername}>{item.username}</Text>
          <Text style={styles.passwordValue}>{item.password}</Text>
          {item.favorite && (
            <View style={styles.favoriteBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.favoriteText}>Favorito</Text>
            </View>
          )}
        </View>
        <View style={styles.passwordActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleActionPress(item, 'view')}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
              size={24} 
              color="#4285F4" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, !isPasswordVisible && styles.disabledButton]}
            onPress={() => isPasswordVisible && handleActionPress(item, 'copy')}
            disabled={!isPasswordVisible}
          >
            <Ionicons 
              name="copy-outline" 
              size={24} 
              color={isPasswordVisible ? "#4285F4" : "#CCCCCC"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditPress(item)}
          >
            <Ionicons name="create-outline" size={24} color="#4285F4" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeletePress(item)}
          >
            <Ionicons name="trash-outline" size={24} color="#FF5B5B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Minhas Senhas</Text>
          <TouchableOpacity style={styles.addButton} onPress={openModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text>Carregando...</Text>
          </View>
        )}

        {!loading && passwords.length > 0 ? (
          <FlatList
            data={passwords}
            renderItem={renderItem}
            keyExtractor={(item) => item.id || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            extraData={passwords}
          />
        ) : !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma senha salva ainda</Text>
            <Text style={styles.emptySubtext}>Adicione sua primeira senha clicando no botão +</Text>
          </View>
        )}

        {/* Modal de criação/edição */}
        <PasswordModal
          visible={showModal}
          onClose={closeModal}
          userId={user?.usuarioID || ''}
          isEditing={isEditing}
          editingItem={editingItem}
          onSuccess={fetchPasswords}
        />

        {/* Modal de autenticação */}
        <Modal visible={authModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Digite sua senha</Text>
              <TextInput placeholder="Senha" style={styles.input} secureTextEntry value={authPassword} onChangeText={setAuthPassword} />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setAuthModalVisible(false);
                    setAuthPassword('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAuthConfirm}>
                  <Text style={styles.buttonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de confirmação de exclusão */}
        <Modal visible={showDeleteConfirm} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
              <Text style={styles.deleteConfirmText}>
                Tem certeza que deseja excluir a senha "{selectedItem?.title}"?
                Esta ação não pode ser desfeita.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: '#FF5B5B' }]} 
                  onPress={handleDeletePassword}
                >
                  <Text style={styles.buttonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4285F4',
    padding: 8,
    borderRadius: 50,
  },
  passwordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  passwordInfo: {
    flex: 1,
  },
  passwordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  passwordUsername: {
    fontSize: 14,
    color: '#888',
  },
  passwordActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#FF5B5B',
    padding: 10,
    borderRadius: 5,
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    width: '48%',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  favoriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  favoriteText: {
    color: '#FFA000',
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordValue: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'monospace',
  },
  disabledButton: {
    opacity: 0.5,
  },
  deleteConfirmText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default PasswordListScreen;
