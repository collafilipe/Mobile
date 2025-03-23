import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import path from "path";

// Carrega as variáveis de ambiente do arquivo .env
config();

// Cria uma instância de DataSource
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "passwordManager",
  synchronize: true, // Nunca use synchronize em produção!
  logging: false,
  entities: [path.join(__dirname, "/entity/**/*.{js,ts}")],
  migrations: [path.join(__dirname, "/migration/**/*.{js,ts}")],
  subscribers: [path.join(__dirname, "/subscriber/**/*.{js,ts}")],
  ssl: process.env.DB_SSL === "true" ? {
    rejectUnauthorized: false
  } : undefined, // undefined ao invés de false para funcionar corretamente
});

// Função para inicializar a conexão com o banco de dados
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Conexão com o banco de dados estabelecida com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar com o banco de dados:", error);
    throw error;
  }
};
