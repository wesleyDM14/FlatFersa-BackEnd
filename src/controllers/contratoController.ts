import { Request, Response } from "express";
import ContratoService from "../services/contratoService";
import { StatusContrato } from "@prisma/client";
import { gerarContratoPDF } from "../functions/gerarContratoPDF";

const contratoService = new ContratoService();

class ContratoController {

    async createContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar novos contratos.' });
            }

            const { duracaoContrato, valorAluguel, diaVencimentoAluguel, dataInicio, limiteKwh, aptId, clienteId, periocidade, leituraAtual, leituraInicial } = req.body;

            if (!duracaoContrato || !valorAluguel || !diaVencimentoAluguel || !dataInicio || (limiteKwh === null || limiteKwh === undefined) || !aptId || !clienteId || !periocidade || (leituraAtual === null || leituraAtual === undefined) || (leituraInicial === null || leituraInicial === undefined)) {
                return res.status(400).json({ message: 'Por favor, envie os dados de cadastro de contrato corretamente.' });
            }

            if (duracaoContrato < 6) {
                return res.status(400).json({ message: 'Duração de contrato não pode ser inferior a 6 meses.' });
            }

            const newContrato = await contratoService.createContrato(duracaoContrato, valorAluguel, diaVencimentoAluguel, dataInicio, limiteKwh, aptId, clienteId, periocidade, leituraInicial, leituraAtual);
            res.status(201).json(newContrato);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao cadastrar o contrato: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao obter todos os contratos: ' + error.message });
        }
    }

    async getContratosWithInfos(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar todos os contratos.' });
            }

            const contratos = await contratoService.getAllContratosWithinfos();

            res.json(contratos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter todos os contratos: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao obter o contrato: ' + error.message });
        }
    }

    async getContratosByUserLoggedIn(req: Request, res: Response) {
        try {
            const userId = req.user.id;
            const contratos = await contratoService.getContratosByUserLoggedIn(userId);
            res.json(contratos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter o contrato: ' + error.message });
        }
    }

    async updateContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não tem permissões o suficiente para atualizar contratos.' });
            }

            const contratoId = req.params.contratoId;
            const { novoStatus, novaDuracao, periodicidadeReajuste } = req.body;

            if (!contratoId) {
                res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!(novoStatus in StatusContrato)) {
                return res.status(400).json({ message: 'Status de contrato inválido.' });
            }

            await contratoService.updateContrato(contratoId, novoStatus, novaDuracao, periodicidadeReajuste);
            res.status(200).json({ message: 'Contrato atualziado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar o contrato: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao deletar contrato: ' + error.message });
        }
    }

    async downloadContratoById(req: Request, res: Response) {
        try {
            const contratoId = req.params.contratoId;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const stream = res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=contrato.pdf',
            });

            await gerarContratoPDF(
                contratoId,
                req.user.id,
                (data: any) => stream.write(data),
                () => stream.end()
            );

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao baixar contrato: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao solicitar contrato: ' + error.message });
        }
    }

    async aprovarContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem aprovar novos contratos.' });
            }

            const { contratoId, valorAluguel, periocidade, limiteKwh, leituraInicial } = req.body;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!valorAluguel || !periocidade || (limiteKwh === null || limiteKwh === undefined) || (leituraInicial === null || leituraInicial === undefined)) {
                return res.status(400).json({ message: 'Informe os dados do contrato corretamente.' });
            }

            const newContrato = await contratoService.aprovarContrato(contratoId, valorAluguel, periocidade, limiteKwh, leituraInicial);
            res.status(200).json(newContrato);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao aprovar contrato: ' + error.message });
        }
    }

    async reprovarContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores porem reprovar contratos.' });
            }

            const contratoId = req.params.contratoId;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await contratoService.reprovarContrato(contratoId);
            res.status(200).json({ message: 'Reprovado com sucesso.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao aprovar contrato: ' + error.message });
        }
    }

    async cancelarContrato(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores porem cancelar contratos.' });
            }

            const { contratoId, message } = req.body;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (!message || message === '') {
                return res.status(400).json({ message: 'Mensagem é obrigatória.' });
            }

            await contratoService.cancelarContrato(contratoId, message);
            res.status(200).json({ message: 'Contrato Cancelado com sucesso.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao aprovar contrato: ' + error.message });
        }
    }

}

export default ContratoController;