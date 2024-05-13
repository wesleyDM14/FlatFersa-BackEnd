import { Request, Response } from "express";
import ContratoService from "../services/contratoService";
import { StatusContrato } from "@prisma/client";
import { gerarContratoPDF } from "../services/gerarContratoPDF";

const contratoService = new ContratoService();

class ContratoController {

    async createContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar novos contratos.' });
            }

            const { duracaoContrato, valorAluguel, diaVencimentoAluguel, dataInicio, limiteKwh, aptId, clienteId, periocidade } = req.body;

            if (!duracaoContrato || !valorAluguel || !diaVencimentoAluguel || !dataInicio || !limiteKwh || !aptId || !clienteId || !periocidade) {
                return res.status(400).json({ message: 'Por favor, envie os dados de cadastro de contrato corretamente.' });
            }

            if (duracaoContrato < 6) {
                return res.status(400).json({ message: 'Duração de contrato não pode ser inferior a 6 meses.' });
            }

            const newContrato = await contratoService.createContrato(duracaoContrato, valorAluguel, diaVencimentoAluguel, dataInicio, limiteKwh, aptId, clienteId, periocidade);
            res.status(201).json(newContrato);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao cadastrar o contrato.' });
        }

    }

    async getContratos(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar todos os contratos.' });
            }

            const contratos = await contratoService.getAllContratos();

            res.json(contratos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter todos os contratos.' });
        }
    }

    async getContratoById(req: Request, res: Response) {
        try {
            const contratoId = req.params.contratoId;
            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }
            const contrato = await contratoService.getContratoById(contratoId, req.user.id, req.user.isAdmin);

            res.json(contrato);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter o contrato.' });
        }
    }

    async getContratosByUserLoggedIn(req: Request, res: Response) {
        try {
            const userId = req.user.id;
            const contratos = await contratoService.getContratosByUserLoggedIn(userId);
            res.json(contratos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter o contrato.' });
        }
    }

    async updateContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não tem permissões o suficiente para atualizar contratos.' });
            }

            const contratoId = req.params.contratoId;
            const { novoStatus } = req.body;

            if (!contratoId) {
                res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!(novoStatus in StatusContrato)) {
                return res.status(400).json({ message: 'Status de contrato inválido.' });
            }

            await contratoService.updateContrato(contratoId, novoStatus);
            res.status(200).json({ message: 'Contrato atualziado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar o contrato.' });
        }
    }

    async deleteContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não tem autorização para deletar contrato.' });
            }

            const contratoId = req.params.contratoId;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await contratoService.deleteContrato(contratoId);

            res.json({ message: 'Contrato deletado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao deletar contrato.' });
        }
    }

    async downloadContratoById(req: Request, res: Response) {
        try {
            const contratoId = req.params.contratoId;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const stream = res.writeHead(200, {
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=contrato.pdf",
            });

            await gerarContratoPDF(contratoId, req.user.id,
                (data) => stream.write(data),
                () => stream.end()
            );

            res.send('invoice');

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao baixar contrato.' });
        }
    }

    async solicitarContrato(req: Request, res: Response) {
        try {
            const { duracaoContrato, diaVencimentoAluguel, dataInicio, aptId } = req.body;

            if (!duracaoContrato || !diaVencimentoAluguel || !dataInicio || !aptId) {
                return res.status(400).json({ message: 'Por favor, envie os dados de cadastro de contrato corretamente.' });
            }

            if (duracaoContrato < 6) {
                return res.status(400).json({ message: 'Duração de contrato não pode ser inferior a 6 meses.' });
            }

            const newContrato = await contratoService.solicitarContrato(duracaoContrato, diaVencimentoAluguel, dataInicio, aptId, req.user.id);
            res.status(201).json(newContrato);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao solicitar contrato.' });
        }
    }

    async aprovarContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem aprovar novos contratos.' });
            }

            const contratoId = req.params.contratoId;
            const { valorAluguel, periocidade } = req.body;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!valorAluguel || !periocidade) {
                return res.status(400).json({ message: 'Informe os dados do contrato corretamente.' });
            }

            const newContrato = await contratoService.aprovarContrato(contratoId, valorAluguel, periocidade);
            res.status(200).json(newContrato);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao aprovar contrato.' });
        }
    }

}

export default ContratoController;