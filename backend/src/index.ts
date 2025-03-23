import "reflect-metadata";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { initializeDatabase } from "./data-source";
import { userRoutes } from "./routes/userRoutes";
import { passwordRoutes } from "./routes/passwordRoutes";

// Carrega as variáveis de ambiente
config();

// Cria a aplicação Express
const app = express();

// Configuração de middlewares
app.use(cors());
app.use(express.json());

// Definição das rotas
app.use("/api/users", userRoutes);
app.use("/api/passwords", passwordRoutes);

// Rota de teste para verificar se o servidor está funcionando
app.get("/", (req, res) => {
    res.send("API do Gerenciador de Senhas está funcionando!");
});

// Porta do servidor
const PORT = process.env.PORT || 5000;

// Função para iniciar o servidor
const startServer = async () => {
    try {
        // Inicializa a conexão com o banco de dados
        await initializeDatabase();
        
        // Inicia o servidor
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
    });
    } catch (error) {
        console.error("Erro ao iniciar o servidor:", error);
        process.exit(1);
    }
};

// Inicia o servidor
startServer();
