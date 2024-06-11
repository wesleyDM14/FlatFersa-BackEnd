import { Request, Response } from "express";
import AvisoService from "../services/avisoServices";

const avisoService = new AvisoService();

class AvisoController {

    async createAvisoGeral(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar avisos globais.' });
            }

            const { title, content } = req.body;

            if (!title || !content) {
                return res.status(400).json({ message: 'As informações do Aviso são obrigatórias.' });
            }

            const message = await avisoService.createAvisoGeral(title, content);

            res.status(201).json(message);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async createAvisoByUserId(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar avisos.' });
            }

            const { title, content, userId } = req.body;

            if (!userId) {
                return res.status(400).json({ message: 'ID de usuário não fornecido.' });
            }

            if (!title || !content) {
                return res.status(400).json({ message: 'As informações do Aviso são obrigatórias.' });
            }

            const aviso = await avisoService.createAvisoByUserId(title, content, userId);

            res.status(201).json({ message: 'Aviso Criado com sucesso', data: aviso });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getAvisos(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar avisos.' });
            }

            const avisos = await avisoService.getAvisos();
            return res.json(avisos);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getAvisosByUserId(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar avisos.' });
            }
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'ID de usuário não fornecido.' });
            }

            const avisos = await avisoService.getAvisosByUserId(userId);
            return res.json(avisos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getAvisosByUserLoggedIn(req: Request, res: Response) {
        try {
            const avisos = await avisoService.getAvisosByUserId(req.user.id);
            return res.json(avisos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async updateAviso(req: Request, res: Response) {
        try {
            const avisoId = req.params.avisoId;

            if (!avisoId) {
                return res.status(400).json({ message: 'ID do aviso não fornecido.' });
            }

            await avisoService.updateAviso(avisoId, req.user.id);
            return res.json({ message: 'Aviso atualizado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async deleteAviso(req: Request, res: Response) {
        try {

            const avisoId = req.params.apartamentoId;

            if (!avisoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await avisoService.deleteAviso(avisoId, req.user.id);
            return res.json({ message: 'Aviso deletado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }
}

export default AvisoController;