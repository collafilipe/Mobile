import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';

// IP constante para facilitar manutenção
const API_URL = 'http://172.20.10.3:5000';

type PasswordItem = {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  favorite: boolean;
};

const PasswordListScreen = () => {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<PasswordItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [selectedItem, setSelectedItem] = useState<PasswordItem | null>(null);
  const [actionType, setActionType] = useState<'view' | 'copy' | null>(null);

  // Função para buscar as senhas do usuário
  const fetchPasswords = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/passwords/${user.id}`);
      
      if (response.data && response.data.passwords) {
        const formattedPasswords = response.data.passwords.map((item: any) => ({
          id: item._id || item.id,
          title: item.name,
          username: item.email,
          password: '********',
          favorite: item.favorite || false
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

  // Adiciona nova senha
  const handleAddPassword = async () => {
    if (!name || !email || !password || !user?.id) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/passwords/${user.id}`, {
        name,
        email,
        password,
        notes,
        favorite,
      });

      if (response.data.success) {
        // Atualiza a lista de senhas após adicionar nova senha
        fetchPasswords();
        closeModal();
        Alert.alert('Sucesso', 'Senha criada com sucesso!');
      } else {
        Alert.alert('Atenção', response.data.error || 'Erro ao criar senha');
      }
    } catch (error) {
      // Silenciosamente falha - não mostra erro no console
      Alert.alert('Atenção', 'Não foi possível salvar a senha. Tente novamente.');
    }
  };

  // Função para revelar a senha
  const revealPassword = async (item: PasswordItem) => {
    try {
      if (!user?.id) return;
      
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
      
      const response = await axios.get(`${API_URL}/api/passwords/${user.id}/${passwordId}`);
      
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
      
      if (!user?.id) return;
      
      setLoading(true);
      // Usamos o ID da senha, com fallback para evitar undefined
      const passwordId = item.id || '';
      
      const response = await axios.get(`${API_URL}/api/passwords/${user.id}/${passwordId}`);
      
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

  // Modal de autenticação para visualizar/copiar a senha
  const handleActionPress = (item: PasswordItem, type: 'view' | 'copy') => {
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

  const handleAuthConfirm = async () => {
    if (!authPassword) {
      Alert.alert('Atenção', 'Digite sua senha para continuar.');
      return;
    }

    if (!user?.id || !selectedItem) {
      setAuthModalVisible(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/passwords/verify-password`, {
        userId: user.id,
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
          }
        }, 300);
      } else {
        Alert.alert('Atenção', 'Senha incorreta!');
      }
    } catch (error: any) {
      // Não mostramos o erro no console - isso evita que apareça na tela
      // Apenas mostramos a mensagem de erro para o usuário
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
  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    clearForm();
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setNotes('');
    setFavorite(false);
  };

  const renderItem = ({ item }: { item: PasswordItem }) => {
    // Verifica se a senha está visível
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
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={24} color="#4285F4" />
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

        {/* Modal de criação */}
        <Modal visible={showModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.overlayTouchable} onPress={closeModal} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboardContainer}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Criar Nova Senha</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome*</Text>
                  <TextInput style={styles.input} placeholder="Ex: Gmail" value={name} onChangeText={setName} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>E-mail*</Text>
                  <TextInput style={styles.input} placeholder="Ex: usuario@gmail.com" value={email} onChangeText={setEmail} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Senha*</Text>
                  <TextInput style={styles.input} placeholder="Digite a senha" value={password} onChangeText={setPassword} secureTextEntry />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notas</Text>
                  <TextInput style={[styles.input, { height: 80 }]} placeholder="Informações extras (opcional)" value={notes} onChangeText={setNotes} multiline />
                </View>

                <View style={styles.switchContainer}>
                  <Text>Favorito</Text>
                  <Switch value={favorite} onValueChange={setFavorite} />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddPassword}>
                    <Text style={styles.buttonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

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
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalKeyboardContainer: {
    justifyContent: 'center',
    flex: 1,
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
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'flex-end',
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
});

export default PasswordListScreen;
