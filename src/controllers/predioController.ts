import { Request, Response } from "express";
import PredioService from "../services/predioService";

const predioService = new PredioService();

class PredioController {
    async createPredio(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar predio.' });
            }
            const { endereco, bairro, cidade, estado, numApt, nome, kwhPrice } = req.body;

            if (!nome) {
                return res.status(400).json({ message: 'Nome é obrogatório.' });
            }

            if (!endereco || !bairro || !cidade || !estado || !kwhPrice) {
                return res.status(400).json({ message: 'Dados obrogatórios não informados.' });
            }

            const newPredio = await predioService.createPredio(endereco, bairro, cidade, estado, numApt, nome, kwhPrice);
            res.status(201).json(newPredio);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getPredios(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar predios.' });
            }
            const predios = await predioService.getPredios();
            res.json(predios);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getPredioById(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar predio.' });
            }
            const predioId = req.params.predioId;

            if (!predioId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const predio = await predioService.getPredioById(predioId);

            return res.json(predio)
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async updatePredio(req: Request, res: Response) {
        try {
            const predioId = req.params.predioId;

            const { endereco, bairro, cidade, estado, numApt, kwhPrice } = req.body;

            if (!predioId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!endereco || !bairro || !cidade || !estado || !kwhPrice) {
                return res.status(400).json({ message: 'Dados obrigatórios não informados.' });
            }

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem atualizar predios.' });
            }

            await predioService.updatePredio(predioId, endereco, bairro, cidade, estado, numApt, kwhPrice);
            return res.json({ message: 'Predio atualizado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async deletePredio(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem deletar predios.' });
            }
            const predioId = req.params.predioId;
            if (!predioId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }
            await predioService.deletePredio(predioId);
            return res.json({ message: 'Prédio deletado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }
}

export default PredioController;