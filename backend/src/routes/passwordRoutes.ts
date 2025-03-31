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

    // Validação de parâmetros
    if (!userId || !passwordId || passwordId === 'undefined' || passwordId === 'null') {
        return res.status(400).json({ 
            success: false,
            error: 'Parâmetros inválidos',
            message: 'ID de usuário e senha são obrigatórios'
        });
    }

    try {
        const result = await buscarSenhaPorId(userId, passwordId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        console.error('Erro ao buscar senha na rota:', error);
        // Verificação específica para erro de UUID inválido
        if (error.code === '22P02') {
            return res.status(400).json({
                success: false,
                error: 'ID de senha inválido',
                message: 'O formato do ID da senha é inválido'
            });
        }
        res.status(500).json({ error: 'Erro ao buscar senha', details: error.message });
    }
});

router.post('/verify-password', async (req: Request, res: Response) => {
    const { userId, password } = req.body;

    console.log('Requisição de verificação de senha recebida:', { userId, password });

    if (!userId || !password) {
        console.log('Dados incompletos:', { userId, password });
        return res.status(400).json({ 
            success: false,
            error: 'Usuário e senha são obrigatórios.' 
        });
    }

    try {
        const result = await verificarSenha(userId, password);
        console.log('Resultado da verificação:', result);

        if (!result.success) {
            return res.status(401).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        console.error('Erro na rota de verificação:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao verificar a senha', 
            details: error.message 
        });
    }
});

/**
 * Criar nova senha
 * POST /passwords/:userId
 */
router.post('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { name, email, password, notes, favorite } = req.body;

    if (!name || !password) {
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
