# Gerenciador de Senhas

Um aplicativo móvel para gerenciar suas senhas de forma segura, desenvolvido com React Native e Expo.

## Funcionalidades

- **Login**: Autenticação de usuários
- **Lista de Senhas**: Visualize, adicione, edite e exclua suas senhas salvas
- **Perfil**: Gerencie suas configurações e informações pessoais

## Estrutura do Projeto

```
src/
  ├── components/       # Componentes reutilizáveis
  ├── context/          # Contextos React (AuthContext)
  ├── navigation/       # Configuração de navegação
  ├── screens/          # Telas do aplicativo
  │   ├── Login/        # Tela de login
  │   ├── PasswordList/ # Tela de lista de senhas
  │   └── Profile/      # Tela de perfil
  └── utils/            # Funções utilitárias
```

## Tecnologias Utilizadas

- React Native
- Expo
- TypeScript
- React Navigation
- Context API para gerenciamento de estado

## Como Executar

1. Certifique-se de ter o Node.js instalado
2. Instale o Expo CLI: `npm install -g expo-cli`
3. Clone este repositório
4. Instale as dependências: `npm install`
5. Execute o projeto: `npm start`
6. Escaneie o QR code com o aplicativo Expo Go (Android) ou a câmera (iOS)

## Próximos Passos

- Implementar backend para autenticação real
- Adicionar criptografia para armazenamento seguro de senhas
- Implementar autenticação biométrica
- Adicionar funcionalidade de backup e sincronização 