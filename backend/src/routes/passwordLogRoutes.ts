import express, { Request, Response } from "express";
import { 
    getPasswordLogs,
    clearPasswordLogs,
    getPasswordLogsWithSensitiveData
} from "../controller/passwordLogController";
import { AppDataSource } from "../data-source";
import { PasswordLog } from "../entity/passwordLog";

const router = express.Router();

/**
 * Get password logs for a user
 * GET /password-logs/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const result = await getPasswordLogs(userId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar logs de senha', 
            details: error.message 
        });
    }
});

/**
 * Clear all password logs for a user
 * DELETE /password-logs/:userId
 */
router.delete('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const result = await clearPasswordLogs(userId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: 'Erro ao limpar logs de senha', 
            details: error.message 
        });
    }
});

/**
 * Clear password logs by type for a user
 * DELETE /password-logs/:userId/:type
 */
router.delete('/:userId/:type', async (req: Request, res: Response) => {
    const { userId, type } = req.params;

    if (!['all', 'create', 'update', 'delete'].includes(type)) {
        return res.status(400).json({
            success: false,
            error: 'Tipo inválido. Use: all, create, update ou delete'
        });
    }

    try {
        if (type === 'all') {
            const result = await clearPasswordLogs(userId);
            return res.status(200).json(result);
        } else {
            // Implement clearing logs by type
            const logRepository = AppDataSource.getRepository(PasswordLog);
            await logRepository.delete({
                user: { usuarioID: userId },
                actionType: type as any
            });
            
            return res.status(200).json({
                success: true,
                message: `Logs de senha do tipo ${type} limpos com sucesso`
            });
        }
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: 'Erro ao limpar logs de senha', 
            details: error.message 
        });
    }
});

/**
 * Get password logs with sensitive data for a user
 * POST /password-logs/:userId/sensitive
 */
router.post('/:userId/sensitive', async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Senha não fornecida'
        });
    }

    try {
        const result = await getPasswordLogsWithSensitiveData(userId, password);

        if (!result.success) {
            return res.status(401).json(result);
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar logs com dados sensíveis', 
            details: error.message 
        });
    }
});

export { router as passwordLogRoutes };
