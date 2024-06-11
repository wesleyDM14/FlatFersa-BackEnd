import { Request, Response } from "express";
import PrestacaoService from "../services/prestacaoService";

const prestacaoService = new PrestacaoService();

class PrestacaoController {

    async createPrestacao(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar prestações de alugueis.' });
            }

            const { mesReferencia, valor, dataVencimento, contratoId } = req.body;

            if (!mesReferencia || !valor || !dataVencimento || !contratoId) {
                return res.status(400).json({ message: 'Por favor envie as infomações corretamente.' });
            }

            const newPrestacao = await prestacaoService.createPrestacao(mesReferencia, valor, dataVencimento, contratoId);

            return res.status(201).json(newPrestacao);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao cadastrar prestação do aluguel.' });
        }
    }

    async getAllPrestacao(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não tem permissão para acessar todas as prestações de alugueis.' });
            }

            const prestacoes = await prestacaoService.getAllPrestacoes();

            return res.status(200).json(prestacoes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter as prestações do contrato.' });
        }
    }

    async getPrestacaoById(req: Request, res: Response) {
        try {
            const prestacaoId = req.params.prestacaoId;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID nao fornecido.' });
            }

            const prestacao = await prestacaoService.getPrestacaoById(prestacaoId, req.user.id, req.user.isAdmin);

            return res.status(200).json(prestacao);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter a prestacao do aluguel.' });
        }
    }

    async getPrestacoesByContratoId(req: Request, res: Response) {
        try {
            const contratoId = req.params.contratoId;

            if (!contratoId) {
                return res.status(400).json({ message: 'ID de contrato não fornecido.' });
            }

            const prestacoes = await prestacaoService.getPrestacoesByContratoId(contratoId, req.user.id, req.user.isAdmin);

            return res.status(200).json(prestacoes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter as prestações do contrato.' });
        }
    }

    async getPrestacoesByMouth(req: Request, res: Response) {
        try {
            const mesReferencia: number = parseInt(req.params.mesReferencia);

            if (!mesReferencia) {
                return res.status(400).json({ message: 'Mês referência não fornecido.' });
            }

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar os algueis por mês.' });
            }

            const prestacoes = await prestacaoService.getPrestacoesByMounth(mesReferencia);

            return res.status(200).json(prestacoes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter as prestações dos alugueis.' });
        }
    }

    async getPrestacaoByUserId(req: Request, res: Response) {
        try {
            const prestacoes = await prestacaoService.getPrestacaoByUserId(req.user.id);

            return res.status(200).json(prestacoes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter as prestações do usuário.' });
        }
    }

    async updatePrestacao(req: Request, res: Response) {
        try {
            if (req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não tem autorização para atualizar prestações de alugueis.' });
            }
            const prestacaoId = req.params.prestacaoId;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID de prestação não fornecido.' });
            }

            const { consumoKWh } = req.body;

            if (!consumoKWh) {
                return res.status(400).json({ message: 'Por favor informe o consumo em KWh do mês.' });
            }

            await prestacaoService.updatePrestacao(prestacaoId, consumoKWh);

            return res.status(200).json({ message: 'Pretação de aluguelç atualizada com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar a prestação do aluguel.' });
        }
    }

    async registraPagamento(req: Request, res: Response) {
        try {
            const prestacaoId = req.params.prestacaoId;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID não fonecido.' });
            }

            await prestacaoService.registrarPagamento(prestacaoId);

            return res.status(200).json({ message: 'Prestação paga com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao registrar pagamento na prestação do aluguel.' });
        }
    }

    async confirmaPagamento(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Sem autorização.' });
            }

            const prestacaoId = req.params.prestacaoId;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID não fonecido.' });
            }

            await prestacaoService.aprovaPagamento(prestacaoId);
            return res.status(200).json({ message: 'Prestação aprovada com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao confirmar pagamento na prestação do aluguel.' });
        }
    }

    async deletePrestacao(req: Request, res: Response) {
        try {
            const prestacaoId = req.params.prestacaoId;

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Sem autorização.' });
            }

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await prestacaoService.deletePrestacao(prestacaoId);

            return res.status(200).json({ message: 'Prestação deletada com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao deletar prestação do aluguel.' });
        }
    }

    async generateQrCodePix(req: Request, res: Response) {
        try {
            const { prestacaoId } = req.body;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const qrCode = await prestacaoService.generateQrCodePixPagamento(prestacaoId);

            return res.status(200).json(qrCode);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao gerar QrCode de pagamento da prestação.' });
        }
    }

}

export default PrestacaoController;