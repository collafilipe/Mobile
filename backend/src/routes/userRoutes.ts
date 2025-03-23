import express, { Request, Response } from "express";
import { criarUsuario, excluirUsuario, redefinirSenha, buscarUsuarioPorId, validarToken, login, mandarToken, alterarUsuario } from "../controller/userController";

const router = express.Router();

router.post('/cadastrar', async (req: Request, res: Response) => {
    const { nome, email, senha, isAdmin } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const result = await criarUsuario(nome, email, senha, isAdmin);
    res.json(result);
});

router.delete('/excluir/:id', async (req: Request, res: Response) => {
    const userID = req.params.id;
    if (!userID) {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
    }

    const result = await excluirUsuario(userID);
    res.json(result);
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    console.log(email, senha);
    const result = await login(email, senha);
    res.json(result);
});

router.get('/validar/:token', async (req: Request, res: Response) => {
    const token = req.params.token;
    if (!token) {
        return res.status(400).json({ error: 'Token não fornecido' });
    }

    const result = await validarToken(token);
    res.json(result);
}
);

router.post('/esqueci-senha', async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email não fornecido' });
    }

    try {
        res.json(await mandarToken(email));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar email', details: error.message });
    }
});

router.put('/redefinir-senha/:token/:novaSenha', async (req: Request, res: Response) => {
    const token = req.params.token;
    const novaSenha = req.params.novaSenha;
    res.json(await redefinirSenha(token, novaSenha));
});

router.put('/alterar-usuario/:id', async (req: Request, res: Response) => {
    const { nome, email, senha, isAdmin } = req.body;
    const userID = req.params.id;

    if (!userID) {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
    }

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
        const result = await alterarUsuario(userID, nome, email, senha, isAdmin);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar usuário', details: error.message });
    }
});

router.get('/buscar/:id', async (req: Request, res: Response) => {
    const userID = req.params.id;
    if (!userID) {
        return res.status(400).json({ error: 'ID do usuário não fornecido' });
    }

    const user = await buscarUsuarioPorId(userID);
    res.json(user);
});

export { router as userRoutes }; 