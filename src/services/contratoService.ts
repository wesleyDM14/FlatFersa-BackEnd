import { addMonths } from "date-fns";

import prismaClient from "../prisma";
import { PeriodicidadeContrato, StatusApartamento, StatusContrato, StatusPagamento, TipoPagamento } from "@prisma/client";
import getToken from "../functions/getToken";
import fs from 'fs';
import axios from "axios";

class ContratoService {

    async createContrato(duracaoContrato: number, valorAluguel: number, diaVencimentoAluguel: number, dataInicio: Date, limiteKwh: number, aptId: string, clientId: string, periocidade: PeriodicidadeContrato, leituraInicial: number, leituraAtual: number) {
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
                            leituraInicial: leituraInicial,
                            leituraAtual: leituraAtual
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
            const parcelas = await prismaClient.prestacaoAluguel.findMany({ where: { contractId: element.id }, orderBy: {dataVencimento: 'asc'} });
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

    async updateContrato(contratoId: string, novoStatus: StatusContrato, novaDuracao: number, periodicidadeReajuste: PeriodicidadeContrato) {
        const contratoExisting = await prismaClient.contrato.findFirst({
            where: { id: contratoId },
            include: { prestacaoAluguel: true }
        });

        if (!contratoExisting) {
            throw new Error('Contrato não encontrado no banco de dados.');
        }

        let novaDuracaoGeral = contratoExisting.duracaoContrato;

        const ultimaPrestacao = contratoExisting.prestacaoAluguel.reduce((ultima, prestacao) => {
            return prestacao.dataVencimento > ultima.dataVencimento ? prestacao : ultima;
        }, contratoExisting.prestacaoAluguel[0]);

        let ultimaDataVencimento = ultimaPrestacao.dataVencimento;
        const novasPrestacoes = [];

        if (novaDuracao > 0) {
            novaDuracaoGeral += novaDuracao;

            for (let i = 1; i < novaDuracao; i++) {
                ultimaDataVencimento = addMonths(ultimaDataVencimento, 1);
                novasPrestacoes.push({
                    contractId: contratoExisting.id,
                    mesReferencia: ultimaDataVencimento.getMonth() + 1,
                    valor: contratoExisting.valorAluguel,
                    dataVencimento: ultimaDataVencimento
                });
            }
        }

        const today = new Date();

        await prismaClient.$transaction(async (prisma) => {
            await prisma.contrato.update({
                where: {
                    id: contratoId
                },
                data: {
                    statusContrato: novoStatus,
                    periodicidadeReajuste: periodicidadeReajuste,
                    duracaoContrato: novaDuracaoGeral
                }
            });

            await prisma.prestacaoAluguel.createMany({
                data: novasPrestacoes
            });

            if (novoStatus === "CANCELADO") {
                await prisma.apartamento.update({
                    where: { id: contratoExisting.aptId },
                    data: { status: StatusApartamento.VAGO }
                });

                const prestacoesRestantes = await prisma.prestacaoAluguel.findMany({
                    where: {
                        dataVencimento: {
                            gt: today
                        }
                    }
                });

                prestacoesRestantes.map(async (element) => {
                    await prisma.prestacaoAluguel.update({
                        where: { id: element.id },
                        data: { statusPagamento: StatusPagamento.CANCELADO }
                    })
                });
            }
        });

        return;

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

        return;
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
                    statusContrato: StatusContrato.AGUARDANDO,
                    leituraAtual: 0,
                    leituraInicial: 0
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

    async aprovarContrato(contratoId: string, valorAluguel: number, periocidade: PeriodicidadeContrato, limiteKwh: number, leituraInicial: number) {
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
                    let mesReferencia = dataAux.getMonth() + 1;
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
                        limiteKwh: limiteKwh,
                        leituraInicial: leituraInicial,
                        leituraAtual: leituraInicial
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
            }, {
                timeout: 60000
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

    async cancelarContrato(contratoId: string, message: string) {
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

                let prestacoes = await prisma.prestacaoAluguel.findMany({ where: { contractId: contractExisting.id } });

                for (let index = 0; index < prestacoes.length; index++) {
                    let element = prestacoes[index];

                    if (element.statusPagamento === StatusPagamento.PENDENTE) {
                        await prisma.prestacaoAluguel.update({
                            where: { id: element.id },
                            data: { statusPagamento: StatusPagamento.CANCELADO }
                        });
                    }
                }

                const clientUser = await prisma.user.findFirst({ where: { clientId: contractExisting.clientId } });

                await prisma.avisos.create({
                    data: {
                        userId: clientUser.id,
                        title: 'Cancelamento de Contrato',
                        content: message,
                    }
                });
            }, {
                timeout: 60000
            });

            return;
        } catch (error) {
            throw new Error('Erro ao Cancelar contrato: ' + error.message);
        }
    }

    async assinarContrato(contratoid: string, contratoAssinado: Express.Multer.File) {
        const contractExisting = await prismaClient.contrato.findFirst({ where: { id: contratoid } });

        if (!contractExisting) {
            throw new Error('Contrato não existe no Banco de Dados.');
        }

        if (contractExisting.assinado) {
            throw new Error('Contrato não está em etapa de assinatura.');
        }

        let linkContratoAssinado = '';

        try {
            const token = await getToken();

            const response = await axios.post(
                `${process.env.WORDPRESS_URL}/wp-json/wp/v2/media`,
                fs.createReadStream(contratoAssinado.path),
                {
                    headers: {
                        'Content-Disposition': `attachment; filename="${contratoAssinado.originalname}"`,
                        'Content-Type': contratoAssinado.mimetype,
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            fs.unlinkSync(contratoAssinado.path);
            linkContratoAssinado = response.data.source_url;
        } catch (error) {
            throw new Error('Error uploading files to WordPress. ' + error.message);
        }

        await prismaClient.contrato.update({
            where: { id: contractExisting.id },
            data: {
                linkPdfAssinado: linkContratoAssinado,
                assinado: true
            }
        });

        return;
    }

}

export default ContratoService;