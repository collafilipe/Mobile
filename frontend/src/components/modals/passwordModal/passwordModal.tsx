import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from 'axios';

type CreatePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
};

const CreatePasswordModal: React.FC<CreatePasswordModalProps> = ({ visible, onClose, userId }) => {
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [favorite, setFavorite] = useState(false);

  const handleCreatePassword = async () => {
    if (!name || !service || !username || !password) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      const response = await axios.post('http://SEU_IP:5000/api/passwords', {
        userId,
        name,
        service,
        username,
        password,
        notes,
        category,
        favorite
      });

      if (response.data.success) {
        Alert.alert('Sucesso', 'Senha criada com sucesso!');
        limparCampos();
        onClose();
      } else {
        Alert.alert('Erro', response.data.error || 'Erro ao criar senha');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Erro na comunicação com o servidor');
    }
  };

  const limparCampos = () => {
    setName('');
    setService('');
    setUsername('');
    setPassword('');
    setNotes('');
    setCategory('');
    setFavorite(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>Criar Nova Senha</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Serviço"
              value={service}
              onChangeText={setService}
            />

            <TextInput
              style={styles.input}
              placeholder="Usuário"
              value={username}
              onChangeText={setUsername}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Notas (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Categoria (opcional)"
              value={category}
              onChangeText={setCategory}
            />

            <View style={styles.switchContainer}>
              <Text>Favorito?</Text>
              <Switch
                value={favorite}
                onValueChange={setFavorite}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                limparCampos();
                onClose();
              }}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleCreatePassword}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center'
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
});

export default CreatePasswordModal;
