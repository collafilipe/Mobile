# Gerenciador de Senhas

Aplicação de gerenciamento de senhas desenvolvida com React Native para o frontend e Node.js/Express/TypeORM para o backend.

## Configuração do Ambiente

### Pré-requisitos
- Node.js (versão 14 ou superior)
- PostgreSQL instalado e rodando
- Yarn ou NPM

## Configuração do Backend

1. Navegue até a pasta do backend:
```
cd backend
```

2. Instale as dependências:
```
npm install
```

3. Configure o arquivo .env na raiz do diretório backend:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=passwordManager
JWT_SECRET=seu_segredo_jwt
PORT=5000
```

4. Inicie o servidor backend:
```
npm run dev
```

O servidor será iniciado na porta 5000 (ou na porta definida no .env).

## Configuração do Frontend

1. Navegue até a pasta do frontend:
```
cd frontend
```

2. Instale as dependências:
```
npm install
```

3. Inicie o aplicativo:
```
npm start
```

Para rodar em um dispositivo ou emulador específico:
```
npm run android
# ou
npm run ios
```

## API Endpoints

### Usuários

- **POST /api/users/cadastrar** - Criar novo usuário
- **POST /api/users/login** - Autenticar usuário
- **GET /api/users/validar/:token** - Validar token JWT
- **POST /api/users/esqueci-senha** - Enviar e-mail para redefinição de senha
- **PUT /api/users/redefinir-senha/:token/:novaSenha** - Redefinir senha
- **PUT /api/users/alterar-usuario/:id** - Atualizar dados do usuário
- **DELETE /api/users/excluir/:id** - Excluir usuário

### Senhas

- **GET /api/passwords/:userId** - Listar todas as senhas do usuário (com filtros opcionais)
- **GET /api/passwords/:userId/:passwordId** - Buscar senha específica
- **GET /api/passwords/:userId/categorias** - Listar categorias disponíveis
- **POST /api/passwords/:userId** - Criar nova senha
- **PUT /api/passwords/:userId/:passwordId** - Atualizar senha
- **DELETE /api/passwords/:userId/:passwordId** - Excluir senha
- **PATCH /api/passwords/:userId/:passwordId/favorito** - Marcar/desmarcar senha como favorita 