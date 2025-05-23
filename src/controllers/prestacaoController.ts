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
            res.status(500).json({ message: 'Erro ao cadastrar prestação do aluguel: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao obter as prestações do contrato: ' + error.message });
        }
    }

    async getAllPrestacaoWithInfo(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não tem permissão para acessar todas as prestações de alugueis.' });
            }

            const prestacoes = await prestacaoService.getAllPrestacoesWithInfos();

            return res.status(200).json(prestacoes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter as prestações do contrato: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao obter a prestacao do aluguel: ' + error.message });
        }
    }

    async getPrestacaoByIdWithInfos(req: Request, res: Response) {
        try {
            const prestacaoId = req.params.prestacaoId;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID nao fornecido.' });
            }

            const prestacao = await prestacaoService.getPrestacaoByIdWithInfos(prestacaoId, req.user.id, req.user.isAdmin);

            return res.status(200).json(prestacao);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter a prestacao do aluguel: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao obter as prestações do contrato: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao obter as prestações dos alugueis: ' + error.message });
        }
    }

    async getPrestacaoByUserId(req: Request, res: Response) {
        try {
            const prestacoes = await prestacaoService.getPrestacaoByUserId(req.user.id);

            return res.status(200).json(prestacoes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter as prestações do usuário: ' + error.message });
        }
    }

    async updatePrestacao(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não tem autorização para atualizar prestações de alugueis.' });
            }
            const prestacaoId = req.params.prestacaoId;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID de prestação não fornecido.' });
            }

            const { novaLeitura } = req.body;

            if (!novaLeitura) {
                return res.status(400).json({ message: 'Por favor informe o número do contador.' });
            }

            await prestacaoService.updatePrestacao(prestacaoId, novaLeitura);

            return res.status(200).json({ message: 'Pretação de aluguel atualizada com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar a prestação do aluguel: ' + error.message });
        }
    }

    async registraPagamento(req: Request, res: Response) {
        try {
            const prestacaoId = req.params.prestacaoId;
            const { file } = req;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID não fonecido.' });
            }

            if (!file) {
                return res.status(400).json({ message: 'Anexo obrigatório faltando.' });
            }

            await prestacaoService.registrarPagamento(prestacaoId, file);

            return res.status(200).json({ message: 'Prestação paga com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao registrar pagamento na prestação do aluguel: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao confirmar pagamento na prestação do aluguel: ' + error.message });
        }
    }

    async reprovarPagamento(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Sem autorização.' });
            }

            const prestacaoId = req.params.prestacaoId;

            if (!prestacaoId) {
                return res.status(400).json({ message: 'ID não fonecido.' });
            }

            await prestacaoService.reprovarPagamento(prestacaoId);
            return res.status(200).json({ message: 'Prestação reprovada com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao confirmar efetuar operação: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao deletar prestação do aluguel: ' + error.message });
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
            res.status(500).json({ message: 'Erro ao gerar QrCode de pagamento da prestação: ' + error.message });
        }
    }

    async marcarPago(req: Request, res: Response) {
        try {
            const { prestacaoId } = req.body;

            if (!prestacaoId) {
                return res.status(400).json({ message: "ID não fornecido" });
            }

            await prestacaoService.marcarPago(prestacaoId);

            return res.status(200).json({ message: 'Prestação atualizada com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao gerar QrCode de pagamento da prestação: ' + error.message });
        }
    }

    async marcarPendente(req: Request, res: Response) {
        try {
            const { prestacaoId } = req.body;

            if (!prestacaoId) {
                return res.status(400).json({ message: "ID não fornecido" });
            }

            await prestacaoService.marcarPendente(prestacaoId);

            return res.status(200).json({ message: 'Prestação atualizada com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao gerar QrCode de pagamento da prestação: ' + error.message });
        }
    }

    async getComprovante(req: Request, res: Response) {
            try {
                const parcelaId = req.params.parcelaId;
    
                if (!parcelaId) {
                    return res.status(400).json({ message: 'ID não fornecido.' });
                }
    
                const { stream, contentType, fileName } = await prestacaoService.getLinkComprovante(parcelaId);
                res.setHeader("Content-Type", contentType);
                res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
                stream.pipe(res);
            } catch (error) {
                console.error(error);
                res.status(400).json({ message: error.message });
            }
        }

}

export default PrestacaoController;