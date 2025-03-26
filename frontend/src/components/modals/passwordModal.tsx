import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native';
import axios from 'axios';

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

type PasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  isEditing?: boolean;
  editingItem?: PasswordItem | null;
  onSuccess: () => void;
};

const PasswordModal: React.FC<PasswordModalProps> = ({ 
  visible, 
  onClose, 
  userId,
  isEditing = false,
  editingItem = null,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (isEditing && editingItem) {
      setName(editingItem.title);
      setEmail(editingItem.username);
      setPassword('********');
      setNotes(editingItem.notes || '');
      setFavorite(editingItem.favorite);
    } else {
      clearForm();
    }
  }, [isEditing, editingItem]);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setNotes('');
    setFavorite(false);
  };

  const handleSave = async () => {
    if (!name || !email || (!isEditing && !password)) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      if (isEditing && editingItem) {
        const response = await axios.put(`${API_URL}/api/passwords/${userId}/${editingItem.id}`, {
          name,
          email,
          password: password === '********' ? undefined : password,
          notes,
          favorite,
        });

        if (response.data.success) {
          Alert.alert('Sucesso', 'Senha atualizada com sucesso!');
          onSuccess();
          onClose();
        } else {
          Alert.alert('Atenção', response.data.error || 'Erro ao atualizar senha');
        }
      } else {
        const response = await axios.post(`${API_URL}/api/passwords/${userId}`, {
          name,
          email,
          password,
          notes,
          favorite,
        });

        if (response.data.success) {
          Alert.alert('Sucesso', 'Senha criada com sucesso!');
          clearForm();
          onSuccess();
          onClose();
        } else {
          Alert.alert('Atenção', response.data.error || 'Erro ao criar senha');
        }
      }
    } catch (error) {
      Alert.alert('Atenção', 'Não foi possível salvar a senha. Tente novamente.');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.overlayTouchable} onPress={onClose} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalKeyboardContainer}
        >
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Senha' : 'Criar Nova Senha'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome*</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: Gmail" 
                  value={name} 
                  onChangeText={setName} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-mail*</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: usuario@gmail.com" 
                  value={email} 
                  onChangeText={setEmail} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha{isEditing ? ' (deixe em branco para manter a atual)' : '*'}</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Digite a senha" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notas</Text>
                <TextInput 
                  style={[styles.input, { height: 80 }]} 
                  placeholder="Informações extras (opcional)" 
                  value={notes} 
                  onChangeText={setNotes} 
                  multiline 
                />
              </View>

              <View style={styles.switchContainer}>
                <Text>Favorito</Text>
                <Switch value={favorite} onValueChange={setFavorite} />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>{isEditing ? 'Atualizar' : 'Salvar'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '80%',
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
    marginTop: 10,
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

export default PasswordModal;
