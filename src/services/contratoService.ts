import { addMonths } from "date-fns";

import prismaClient from "../prisma";
import { PeriodicidadeContrato, StatusApartamento, StatusContrato, TipoPagamento } from "@prisma/client";

class ContratoService {

    async createContrato(duracaoContrato: number, valorAluguel: number, diaVencimentoAluguel: number, dataInicio: Date, limiteKwh: number, aptId: string, clientId: string, periocidade: PeriodicidadeContrato) {
        try {
            const apartamentoExisting = await prismaClient.apartamento.findFirst({ where: { id: aptId } });

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

                    for (let index = 0; index < duracaoContrato; index++) {
                        let dataAux = dataVencimento;
                        dataAux = addMonths(dataVencimento, index);
                        let mesReferencia = dataAux.getMonth() + 1;
                        let tipoPagamento = null;
                        if (index === 0) {
                            tipoPagamento = TipoPagamento.CALCAO;
                            mesReferencia = 0;
                            let dataCalcao = new Date(dataInicio);
                            dataAux.setDate(dataCalcao.getDate() + 3);
                        } else {
                            tipoPagamento = TipoPagamento.ALUGUEL;
                        }
                        let aux = await prisma.prestacaoAluguel.create({
                            data: {
                                contractId: newContrato.id,
                                dataVencimento: dataAux,
                                valor: valorAluguel,
                                mesReferencia: mesReferencia,
                                tipo: tipoPagamento
                            }
                        });
                        parcelas.push(aux);
                    }

                    await prisma.apartamento.update({
                        where: { id: aptId },
                        data: {
                            status: StatusApartamento.OCUPADO
                        }
                    });

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
            const currentApt = await prismaClient.apartamento.findFirst({ where: { id: element.aptId } });
            const currentPredio = await prismaClient.predio.findFirst({ where: { id: currentApt.id_predio } });
            const parcelas = await prismaClient.prestacaoAluguel.findMany({ where: { contractId: element.id } });
            let aux = { contrato: element, cliente: currentClient, apartamento: currentApt, financeiro: parcelas, predio: currentPredio };
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
            const currentApt = await prismaClient.apartamento.findFirst({ where: { id: element.aptId } });
            const currentPredio = await prismaClient.predio.findFirst({ where: { id: currentApt.id_predio } });
            const parcelas = await prismaClient.prestacaoAluguel.findMany({ where: { contractId: element.id } });
            let aux = { contrato: element, cliente: clientAlreadyExisting, apartamento: currentApt, financeiro: parcelas, predio: currentPredio };
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

        try {
            await prismaClient.$transaction(async (prisma) => {

                await prisma.contrato.delete({ where: { id: contratoId } });

                await prisma.apartamento.update({
                    where: { id: contratoExisting.aptId },
                    data: {
                        status: StatusApartamento.VAGO
                    }
                });
            });
        } catch (error) {
            throw new Error('Erro ao deletar o contrato.');
        }
    }

    async solicitarContrato(duracaoContrato: number, diaVencimentoAluguel: number, dataInicio: Date, aptId: string, userId: string) {
        try {
            const apartamentoExisting = await prismaClient.apartamento.findFirst({ where: { id: aptId } });

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
                            OR: [
                                {
                                    statusContrato: StatusContrato.ATIVO
                                },
                                {
                                    statusContrato: StatusContrato.AGUARDANDO
                                }
                            ]
                        },

                    ]
                }
            });

            if (contratoAtivo) {
                throw new Error('Cliente com contrato ativo/aguardando ou apartamento com contrato ativo.');
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

            await prismaClient.apartamento.update({
                where: { id: aptId },
                data: { status: StatusApartamento.AGUARDANDO }
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

    async aprovarContrato(contratoId: string, valorAluguel: number, periocidade: PeriodicidadeContrato, limiteKwh: number) {
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
                    let dataAux = dataVencimento;
                    dataAux = addMonths(dataVencimento, index);
                    let mesReferencia = dataVencimento.getMonth() + 1;
                    let tipoPagamento = null;
                    if (index === 0) {
                        tipoPagamento = TipoPagamento.CALCAO;
                        mesReferencia = 0;
                        let dataCalcao = new Date(contractExisting.dataInicio);
                        dataAux.setDate(dataCalcao.getDate() + 3);
                    } else {
                        tipoPagamento = TipoPagamento.ALUGUEL;
                    }
                    let aux = await prisma.prestacaoAluguel.create({
                        data: {
                            contractId: contractExisting.id,
                            dataVencimento: dataAux,
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
                        periodicidadeReajuste: periocidade,
                        valorAluguel: valorAluguel,
                        limiteKwh: limiteKwh
                    }
                });

                await prisma.apartamento.update({
                    where: { id: contractExisting.aptId },
                    data: {
                        status: StatusApartamento.OCUPADO
                    }
                });

                const clientUser = await prismaClient.user.findFirst({ where: { clientId: contractExisting.clientId } });

                await prismaClient.avisos.create({
                    data: {
                        userId: clientUser.id,
                        title: 'Resposta Sobre Contrato',
                        content: `Sua solicitação de contrato foi aprovada, verifique na seção de contratos para poder assiná-lo e assim dar início a sua estadia.`,
                    }
                });

                return { contrato: contractExisting, prestacoes: parcelas };
            });
        } catch (error) {
            throw new Error('Erro ao cadastrar contrato: ' + error.message);
        }
    }

    async reprovarContrato(contratoId: string) {
        const contractExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

        if (!contractExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        try {
            await prismaClient.$transaction(async (prisma) => {

                await prisma.contrato.update({
                    where: { id: contractExisting.id },
                    data: {
                        statusContrato: StatusContrato.CANCELADO,
                    }
                });

                await prisma.apartamento.update({
                    where: { id: contractExisting.aptId },
                    data: { status: StatusApartamento.VAGO }
                });

                const clientUser = await prismaClient.user.findFirst({ where: { clientId: contractExisting.clientId } });

                await prismaClient.avisos.create({
                    data: {
                        userId: clientUser.id,
                        title: 'Resposta Sobre Contrato',
                        content: `Sua solicitação de contrato foi reprovada. Por favor, entre em contato para mais detalhes.`,
                    }
                });

                return;
            });
        } catch (error) {
            throw new Error('Erro ao cadastrar contrato: ' + error.message);
        }
    }

}

export default ContratoService;