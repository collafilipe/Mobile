import express, { Request, Response } from "express";
import { 
    listarSenhas, 
    buscarSenhaPorId, 
    criarSenha, 
    atualizarSenha, 
    excluirSenha, 
    toggleFavorito,
    verificarSenha
} from "../controller/passwordController";

const router = express.Router();

/**
 * Listar todas as senhas do usuário (filtros opcionais)
 * GET /passwords/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { favorite } = req.query;

    const filtros: { favorite?: boolean } = {};
    if (favorite !== undefined) {
        filtros.favorite = favorite === 'true';
    }

    try {
        const result = await listarSenhas(userId, Object.keys(filtros).length > 0 ? filtros : undefined);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao listar senhas', details: error.message });
    }
});

/**
 * Buscar uma senha específica
 * GET /passwords/:userId/:passwordId
 */
router.get('/:userId/:passwordId', async (req: Request, res: Response) => {
    const { userId, passwordId } = req.params;

    try {
        const result = await buscarSenhaPorId(userId, passwordId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao buscar senha', details: error.message });
    }
});

router.post('/verify-password', async (req: Request, res: Response) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const result = await verificarSenha(userId, password);

        if (!result.success) {
            return res.status(401).json(result);  // Se falhar, retorna erro 401 (não autorizado)
        }

        res.status(200).json(result);  // Se for bem-sucedido, retorna sucesso
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao verificar a senha', details: error.message });
    }
});

/**
 * Criar nova senha
 * POST /passwords/:userId
 */
router.post('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { name, email, password, notes, favorite } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
    }

    try {
        const result = await criarSenha(userId, name, email, password, notes, favorite);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao criar senha', details: error.message });
    }
});

/**
 * Atualizar senha
 * PUT /passwords/:userId/:passwordId
 */
router.put('/:userId/:passwordId', async (req: Request, res: Response) => {
    const { userId, passwordId } = req.params;
    const { name, email, password, notes, favorite } = req.body;

    try {
        const result = await atualizarSenha(userId, passwordId, name, email, password, notes, favorite);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao atualizar senha', details: error.message });
    }
});

/**
 * Excluir senha
 * DELETE /passwords/:userId/:passwordId
 */
router.delete('/:userId/:passwordId', async (req: Request, res: Response) => {
    const { userId, passwordId } = req.params;

    try {
        const result = await excluirSenha(userId, passwordId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao excluir senha', details: error.message });
    }
});

/**
 * Marcar/desmarcar como favorita
 * PATCH /passwords/:userId/:passwordId/favorito
 */
router.patch('/:userId/:passwordId/favorito', async (req: Request, res: Response) => {
    const { userId, passwordId } = req.params;
    const { favorite } = req.body;

    if (typeof favorite !== 'boolean') {
        return res.status(400).json({ error: 'Campo favorite deve ser booleano' });
    }

    try {
        const result = await toggleFavorito(userId, passwordId, favorite);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao atualizar favorito', details: error.message });
    }
});

export { router as passwordRoutes };
