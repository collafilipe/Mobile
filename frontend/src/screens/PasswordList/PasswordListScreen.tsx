import React, { useState, useEffect } from 'react';
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

type PasswordItem = {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
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

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [selectedItem, setSelectedItem] = useState<PasswordItem | null>(null);
  const [actionType, setActionType] = useState<'view' | 'copy' | null>(null);

  // Verifica se o user está autenticado
  useEffect(() => {
    if (!user || !user.id) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }
    
    // Carrega as senhas
    const fetchPasswords = async () => {
      try {
        const response = await axios.get(`http://172.20.10.3:5000/api/passwords/${user.id}`, {
          params: { favorite: favorite.toString() },
        });

        // Verifique o formato de resposta
        console.log(response.data);

        const formattedPasswords = response.data.passwords.map((item: any) => ({
          id: item._id,
          title: item.name,
          username: item.email,
          password: '********',
        }));

        setPasswords(formattedPasswords);
      } catch (error) {
        console.error('Erro ao buscar senhas:', error);
        Alert.alert('Erro', 'Não foi possível carregar as senhas.');
      }
    };

    fetchPasswords();
  }, [user, favorite]);

  // Adiciona nova senha
  const handleAddPassword = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      const response = await axios.post(`http://172.20.10.3:5000/api/passwords/${user?.id}`, {
        name,
        email,
        password,
        notes,
        favorite,
      });

      if (response.data.success) {
        const newPassword: PasswordItem = {
          id: response.data.password.id,
          title: name,
          username: email,
          password: '********',
        };
        setPasswords((prev) => [...prev, newPassword]);
        closeModal();
        Alert.alert('Sucesso', 'Senha criada com sucesso!');
      } else {
        Alert.alert('Erro', response.data.error || 'Erro ao criar senha');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro na comunicação com o servidor');
    }
  };

  // Função para revelar a senha
  const revealPassword = async (item: PasswordItem) => {
    try {
      const response = await axios.get(`http://172.20.10.3:5000/api/passwords/${user?.id}/${item.id}`);
      const updatedPasswords = passwords.map((p) =>
        p.id === item.id ? { ...p, password: response.data.password } : p
      );
      setPasswords(updatedPasswords);
    } catch (error) {
      console.error('Erro ao revelar senha:', error);
      Alert.alert('Erro', 'Não foi possível revelar a senha.');
    }
  };

  // Função para copiar a senha
  const copyPassword = async (item: PasswordItem) => {
    try {
      const response = await axios.get(`http://172.20.10.3:5000/api/passwords/${user?.id}/${item.id}`);
      await Clipboard.setStringAsync(response.data.password);
      Alert.alert('Sucesso', 'Senha copiada para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar senha:', error);
      Alert.alert('Erro', 'Não foi possível copiar a senha.');
    }
  };

  // Modal de autenticação para visualizar/copiar a senha
  const handleActionPress = (item: PasswordItem, type: 'view' | 'copy') => {
    setSelectedItem(item);
    setActionType(type);
    setAuthModalVisible(true);
  };

  const handleAuthConfirm = async () => {
    if (!authPassword) {
      Alert.alert('Erro', 'Digite sua senha para continuar.');
      return;
    }

    try {
      const response = await axios.post('http://172.20.10.3:5000/api/passwords/verify-password', {
        userId: user?.id,
        password: authPassword,
      });

      if (response.data.success) {
        if (selectedItem && actionType === 'view') {
          revealPassword(selectedItem);
        } else if (selectedItem && actionType === 'copy') {
          copyPassword(selectedItem);
        }
        setAuthPassword('');
        setAuthModalVisible(false);
      } else {
        Alert.alert('Erro', 'Senha incorreta!');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro na verificação da senha.');
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

  const renderItem = ({ item }: { item: PasswordItem }) => (
    <View style={styles.passwordItem}>
      <View style={styles.passwordInfo}>
        <Text style={styles.passwordTitle}>{item.title}</Text>
        <Text style={styles.passwordUsername}>{item.username}</Text>
        <Text style={styles.passwordUsername}>{item.password}</Text>
      </View>
      <View style={styles.passwordActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleActionPress(item, 'view')}
        >
          <Ionicons name="eye-outline" size={24} color="#4285F4" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleActionPress(item, 'copy')}
        >
          <Ionicons name="copy-outline" size={24} color="#4285F4" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={24} color="#4285F4" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Minhas Senhas</Text>
          <TouchableOpacity style={styles.addButton} onPress={openModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {passwords.length > 0 ? (
          <FlatList
            data={passwords}
            renderItem={({ item }) => (
              <View key={item.id} style={styles.passwordItem}> {/* Adicionando a chave diretamente aqui */}
                <View style={styles.passwordInfo}>
                  <Text style={styles.passwordTitle}>{item.title}</Text>
                  <Text style={styles.passwordUsername}>{item.username}</Text>
                  <Text style={styles.passwordUsername}>{item.password}</Text>
                </View>
                <View style={styles.passwordActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleActionPress(item, 'view')}
                  >
                    <Ionicons name="eye-outline" size={24} color="#4285F4" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleActionPress(item, 'copy')}
                  >
                    <Ionicons name="copy-outline" size={24} color="#4285F4" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="create-outline" size={24} color="#4285F4" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id} // Certificando-se que o id é único
            contentContainerStyle={styles.listContent}
          />
        ) : (
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
});

export default PasswordListScreen;
