import { addMonths } from "date-fns";

import prismaClient from "../prisma";
import PrestacaoService from "./prestacaoService";
import { PeriodicidadeContrato, StatusContrato, TipoPagamento } from "@prisma/client";

class ContratoService {

    private prestacaoService: PrestacaoService;

    constructor() {
        this.prestacaoService = new PrestacaoService();
    }

    async createContrato(duracaoContrato: number, valorAluguel: number, diaVencimentoAluguel: number, dataInicio: Date, limiteKwh: number, aptId: string, clientId: string, periocidade: PeriodicidadeContrato) {
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
                            statusContrato: StatusContrato.ATIVO,
                            periodicidadeReajuste: periocidade,
                        }
                    });

                    let dataVencimento = new Date(dataInicio);
                    dataVencimento.setDate(diaVencimentoAluguel);

                    let parcelas = [];

                    for (let index = 0; index <= duracaoContrato; index++) {
                        dataVencimento = addMonths(dataVencimento, index);
                        let mesReferencia = dataVencimento.getMonth() + 1;
                        let tipoPagamento = null;
                        if (index === 0) {
                            tipoPagamento = TipoPagamento.CALCAO;
                            mesReferencia = 0;
                        } else {
                            tipoPagamento = TipoPagamento.ALUGUEL;
                        }
                        let aux = await prisma.prestacaoAluguel.create({
                            data: {
                                contractId: newContrato.id,
                                dataVencimento: dataVencimento,
                                valor: valorAluguel,
                                mesReferencia: mesReferencia,
                                tipo: tipoPagamento
                            }
                        });
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

    async getAllContratosWithinfos() {
        const contratos = await prismaClient.contrato.findMany();
        const response = [];

        for (let index = 0; index < contratos.length; index++) {
            const element = contratos[index];
            const currentClient = await prismaClient.cliente.findFirst({ where: { id: element.clientId } });
            const currentApt = await prismaClient.apartamento.findFirst({ where: { numeroContrato: element.aptId } });
            let aux = { contrato: element, cliente: currentClient, apartamento: currentApt };
            response.push(aux);
        }

        return response;
    }

    async getContratoById(contratoId: string, userId: string, isAdmin: boolean) {
        const contractExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no banco de dados.');
        }

        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!isAdmin && contractExisting.clientId !== userLoggedIn.clientId) {
            throw new Error('Você não possui autorização para acessar o contrato.');
        }
        return contractExisting;
    }

    async getContratosByUserLoggedIn(userId: string) {
        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        const clientAlreadyExisting = await prismaClient.cliente.findFirst({ where: { id: userLoggedIn.clientId } });

        if (!clientAlreadyExisting) {
            throw new Error('Cliente não encontrado no Banco de Dados.');
        }

        const contracts = await prismaClient.contrato.findMany({ where: { clientId: clientAlreadyExisting.id } });

        const response = [];

        for (let index = 0; index < contracts.length; index++) {
            const element = contracts[index];
            const currentApt = await prismaClient.apartamento.findFirst({ where: { numeroContrato: element.aptId } });
            let aux = { contrato: element, cliente: clientAlreadyExisting, apartamento: currentApt };
            response.push(aux);
        }

        return response;
    }

    async updateContrato(contratoId: string, novoStatus: StatusContrato) {
        const contratoExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });
        if (!contratoExisting) {
            throw new Error('Contrato não encontrado no banco de dados.');
        }
        await prismaClient.contrato.update({
            where: {
                id: contratoId
            },
            data: {
                statusContrato: novoStatus
            }
        });
    }

    async deleteContrato(contratoId: string) {
        const contratoExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });
        if (!contratoExisting) {
            throw new Error('Contrato não encontrado no banco de dados.');
        }

        await prismaClient.contrato.delete({ where: { id: contratoId } });
    }

    async solicitarContrato(duracaoContrato: number, diaVencimentoAluguel: number, dataInicio: Date, aptId: string, userId: string) {
        try {
            const apartamentoExisting = await prismaClient.apartamento.findFirst({ where: { numeroContrato: aptId } });

            if (!apartamentoExisting) {
                throw new Error('Apartamento não encontrado no banco de dados.');
            }

            const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

            const clientId = userLoggedIn.clientId;

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
                            statusContrato: StatusContrato.ATIVO
                        }
                    ]
                }
            });

            if (contratoAtivo) {
                throw new Error('Cliente com contrato ativo ou apartamento com contrato ativo.');
            }

            const newContrato = await prismaClient.contrato.create({
                data: {
                    duracaoContrato: duracaoContrato,
                    valorAluguel: apartamentoExisting.valorBase,
                    diaVencimentoPagamento: diaVencimentoAluguel,
                    dataInicio: dataInicio,
                    aptId: aptId,
                    clientId: clientId,
                    statusContrato: StatusContrato.AGUARDANDO
                }
            });

            const usersAdmin = await prismaClient.user.findMany({ where: { isAdmin: true } });

            Promise.all(
                usersAdmin.map(async (user) => {
                    await prismaClient.avisos.create({
                        data: {
                            userId: user.id,
                            title: 'Solicitação de Novo Contrato',
                            content: `O cliente ${clientExisting.name}, solicita a aprovação de um novo contrato, por favoracesse a seção de Contratos para analizar o pedido.`,
                        }
                    });
                })
            );

            return newContrato;
        } catch (error) {
            console.error(error);
            throw new Error('Erro interno do servidor: ' + error.message);
        }
    }

    async aprovarContrato(contratoId: string, valorAluguel: number, periocidade: PeriodicidadeContrato) {
        const contractExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        try {
            await prismaClient.$transaction(async (prisma) => {

                let dataVencimento = new Date(contractExisting.dataInicio);
                dataVencimento.setDate(contractExisting.diaVencimentoPagamento);

                let parcelas = [];

                for (let index = 0; index <= contractExisting.duracaoContrato; index++) {
                    dataVencimento = addMonths(dataVencimento, index);
                    let mesReferencia = dataVencimento.getMonth() + 1;
                    let tipoPagamento = null;
                    if (index === 0) {
                        tipoPagamento = TipoPagamento.CALCAO;
                        mesReferencia = 0;
                    } else {
                        tipoPagamento = TipoPagamento.ALUGUEL;
                    }
                    let aux = await prisma.prestacaoAluguel.create({
                        data: {
                            contractId: contractExisting.id,
                            dataVencimento: dataVencimento,
                            valor: valorAluguel,
                            mesReferencia: mesReferencia,
                            tipo: tipoPagamento
                        }
                    });
                    parcelas.push(aux);
                }

                await prisma.contrato.update({
                    where: { id: contractExisting.id },
                    data: {
                        statusContrato: StatusContrato.ATIVO,
                        periodicidadeReajuste: periocidade
                    }
                });

                const clientUser = await prismaClient.user.findFirst({ where: { clientId: contractExisting.clientId } });

                await prismaClient.avisos.create({
                    data: {
                        userId: clientUser.id,
                        title: 'Resposta Sobre Contrato',
                        content: `Sua solicitação de contrato foi aprovada, verifique na seção de contratos para poder visualiza-lo.`,
                    }
                });

                return { contrato: contractExisting, prestacoes: parcelas };
            });
        } catch (error) {
            throw new Error('Erro ao cadastrar contrato: ' + error.message);
        }
    }

}

export default ContratoService;