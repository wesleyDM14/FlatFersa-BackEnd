import { addMonths } from "date-fns";

import prismaClient from "../prisma";
import PrestacaoService from "./prestacaoService";

class ContratoService {

    private prestacaoService: PrestacaoService;

    constructor() {
        this.prestacaoService = new PrestacaoService();
    }

    async createContrato(duracaoContrato: number, valorAluguel: number, diaVencimentoAluguel: number, dataInicio: Date, limiteKwh: number, aptId: string, clientId: string) {
        try {
            const apartamentoExisting = await prismaClient.apartamento.findFirst({ where: { numeroContrato: aptId } });
            if (!apartamentoExisting) {
                throw new Error('Apartamento não encontrado no banco de dados.');
            }

            const clientExisting = await prismaClient.cliente.findFirst({ where: { id: clientId } });

            if (!clientExisting) {
                throw new Error('Cliente não encontrado no banco de dados.');
            }

            const contratoAtivo = await prismaClient.contrato.findFirst({
                where: {
                    OR: [
                        {
                            clientId: clientId
                        },
                        {
                            aptId: aptId
                        }
                    ],
                    AND: [
                        {
                            statusContrato: "ATIVO"
                        }
                    ]
                }
            });

            if (contratoAtivo) {
                throw new Error('Cliente com contrato ativo ou apartamento com contrato ativo.');
            }

            try {
                await prismaClient.$transaction(async (prisma) => {
                    const newContrato = await prisma.contrato.create({
                        data: {
                            duracaoContrato: duracaoContrato,
                            valorAluguel: valorAluguel,
                            diaVencimentoPagamento: diaVencimentoAluguel,
                            dataInicio: dataInicio,
                            limiteKwh: limiteKwh,
                            aptId: aptId,
                            clientId: clientId,
                            statusContrato: "ATIVO"
                        }
                    });

                    let dataVencimento = dataInicio;
                    dataVencimento.setDate(diaVencimentoAluguel);

                    let parcelas = [];

                    for (let index = 0; index < duracaoContrato; index++) {
                        dataVencimento = addMonths(dataVencimento, index);
                        let mesReferencia = dataVencimento.getMonth() + 1;
                        let aux = await this.prestacaoService.createPrestacao(mesReferencia, valorAluguel, dataVencimento, newContrato.id);
                        parcelas.push(aux);
                    }

                    return { contrato: newContrato, prestacoes: parcelas };
                });


            } catch (error) {
                throw new Error('Erro ao cadastrar contrato: ' + error.message);
            }

        } catch (error) {
            throw new Error('Erro interno do servidor: ' + error.message);
        }
    }

    async getAllContratos() {
        const contratos = await prismaClient.contrato.findMany();
        return contratos;
    }

    async getContratoById(contratoId: string) {
        const contractExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no banco de dados.');
        }

        return contractExisting;
    }

    async updateContrato(contratoId: string) {

    }

    async deleteContrato(contratoId: string) {

    }

}

export default ContratoService;