import express, { Request, Response } from "express";
import { getUserLoginIps, updateIpTrustStatus } from "../controller/loginIpController";

const router = express.Router();

// Get all login IPs for a user
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const result = await getUserLoginIps(userId);
        res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar IPs de login',
            details: error.message
        });
    }
});

// Update IP trust status
router.put('/:userId/:ipId', async (req: Request, res: Response) => {
    const { userId, ipId } = req.params;
    const { isTrusted } = req.body;

    if (isTrusted === undefined) {
        return res.status(400).json({
            success: false,
            error: 'O parâmetro isTrusted é obrigatório'
        });
    }

    try {
        const result = await updateIpTrustStatus(userId, ipId, isTrusted);
        res.status(result.success ? 200 : 404).json(result);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar status de confiança do IP',
            details: error.message
        });
    }
});

export { router as loginIpRoutes };
