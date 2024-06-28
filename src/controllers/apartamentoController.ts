import { Request, Response } from "express";
import ApartamentoService from "../services/apartamentoService";

const apartamentoService = new ApartamentoService();

class ApartamentoController {

    async createApartamento(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar apartamentos.' });
            }

            const { numero, valorBase, climatizado, predioId } = req.body;

            if (!numero || !valorBase || !predioId) {
                return res.status(400).json({ message: 'As informações de Apartamento são obrigatórias.' });
            }

            const newApartamento = await apartamentoService.createApartamento(numero, valorBase, climatizado, predioId);
            res.status(201).json(newApartamento);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getApartamentos(req: Request, res: Response) {
        try {
            const apartamentos = await apartamentoService.getApartamentos();
            return res.json(apartamentos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getApartamentosWithInfos(req: Request, res: Response) {
        try {
            const apartamentos = await apartamentoService.getApartamentosWithInfos();
            return res.json(apartamentos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getApartamentosByPredioId(req: Request, res: Response) {
        try {
            const predioId = req.params.predioId;

            if (!predioId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }
            const apartamentos = await apartamentoService.getApartamentosByPredioId(predioId);
            return res.json(apartamentos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getApartamentoById(req: Request, res: Response) {
        try {
            const apartamentoId = req.params.apartamentoId;

            if (!apartamentoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const apartamento = await apartamentoService.getApartamentoById(apartamentoId);

            return res.json(apartamento);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async updateApartamento(req: Request, res: Response) {
        try {

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem atualizar apartamentos.' });
            }

            const apartamentoId = req.params.apartamentoId;

            const { climatizado, valorBase } = req.body;

            if (!apartamentoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!valorBase) {
                return res.status(400).json({ message: 'As informações de Apartamento são obrigatórias.' });
            }

            await apartamentoService.updateApartamento(apartamentoId, climatizado, valorBase);

            return res.json({ message: 'Apartamento atualizado com sucesso.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async deleteApartamento(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem deletar apartamentos.' });
            }

            const apartamentoId = req.params.apartamentoId;

            if (!apartamentoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await apartamentoService.deleteApartamento(apartamentoId);
            return res.json({ message: 'Apartamento deletado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }
}

export default ApartamentoController;