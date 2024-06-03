import { StatusPagamento } from "@prisma/client";

import prismaClient from "../prisma";

class PrestacaoService {

    async createPrestacao(mesReferencia: number, valor: number, dataVencimento: Date, contratoId: string) {
        try {
            const contractAlreadyExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

            if (!contractAlreadyExisting) {
                throw new Error('Contrato não encontrado na base de dados.');
            }

            const newPrestacao = await prismaClient.prestacaoAluguel.create({
                data: {
                    contractId: contratoId,
                    dataVencimento: dataVencimento,
                    valor: valor,
                    mesReferencia: mesReferencia,
                }
            });

            return newPrestacao;
        } catch (error) {
            throw new Error('Erro ao cadastrar parcela do aluguel: ' + error.message);
        }
    }

    async getAllPrestacoes() {
        const prestacoes = await prismaClient.prestacaoAluguel.findMany();
        return prestacoes;
    }

    async getPrestacaoById(prestacaoId: string, userId: string, isAdmin: boolean) {

        const prestacao = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacao) {
            throw new Error('Prestacao nao encontrada no banco de dados.');
        }

        const contractByPrestacaoID = await prismaClient.contrato.findFirst({ where: { id: prestacao.contractId } });

        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        if (contractByPrestacaoID.clientId !== userLoggedIn.clientId && !isAdmin) {
            throw new Error('Sem permissão para acessar a prestação.');
        }

        return prestacao;
    }

    async getPrestacoesByContratoId(contratoId: string, userId: string, isAdmin: boolean) {
        const contractAlreadyExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

        if (!contractAlreadyExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        if (contractAlreadyExisting.clientId !== userLoggedIn.clientId && !isAdmin) {
            throw new Error('Você não tem permissão para acessar este contrato.');
        }

        const prestacoes = await prismaClient.prestacaoAluguel.findMany({ where: { contractId: contratoId } });

        return prestacoes;
    }

    async getPrestacaoByUserId(userId: string) {
        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        const clientAlreadyExisting = await prismaClient.cliente.findFirst({ where: { id: userLoggedIn.clientId } });

        if (!clientAlreadyExisting) {
            throw new Error('Cliente não encontrado no Banco de Dados.');
        }

        const contracts = await prismaClient.contrato.findMany({ where: { clientId: clientAlreadyExisting.id } });

        let prestacoes = [];

        Promise.all(
            contracts.map(async (contract) => {
                let prestacaoByContrato = await prismaClient.prestacaoAluguel.findMany({ where: { contractId: contract.id } });
                prestacoes.push(prestacaoByContrato);
            })
        );

        return prestacoes;
    }

    async getPrestacoesByMounth(mesReferencia: number) {
        const prestacoes = await prismaClient.prestacaoAluguel.findMany({ where: { mesReferencia: mesReferencia } });
        return prestacoes;
    }

    async updatePrestacao(prestacaoId: string, consumoKWh: number) {
        try {
            const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

            if (!prestacaoExisting) {
                throw new Error('Prestação de aluguel não encontrada no banco de dados.');
            }

            const contratoByPrestacao = await prismaClient.contrato.findFirst({ where: { id: prestacaoExisting.contractId } });

            const apartamentoContract = await prismaClient.apartamento.findFirst({ where: { numeroContrato: contratoByPrestacao.aptId } });

            const predioApt = await prismaClient.predio.findFirst({ where: { id: apartamentoContract.id_predio } });

            //logica do banco de kWh

            let consumoTotal = consumoKWh;
            let valorAdicional = 0;
            let excesso = 0;

            //verifica se o consumo está dentro do limite mensal
            if (consumoTotal <= contratoByPrestacao.limiteKwh) {
                //acumula creditos não utilizados
                let creditoAcumulado = contratoByPrestacao.limiteKwh - consumoTotal;
                await prismaClient.contrato.update({
                    where: { id: contratoByPrestacao.id },
                    data: { saldoKwh: contratoByPrestacao.saldoKwh + creditoAcumulado }
                });
            } else {
                //Calcula o excesso sem considerar créditos
                excesso = consumoTotal - contratoByPrestacao.limiteKwh;

                //verifica se há créditos acumulados suficientes para cobrir o excesso
                if (excesso <= contratoByPrestacao.saldoKwh) {
                    //Usa os créditos acumulados para cobrir o excesso
                    await prismaClient.contrato.update({
                        where: { id: contratoByPrestacao.id },
                        data: { saldoKwh: contratoByPrestacao.saldoKwh - excesso }
                    });
                } else {
                    excesso -= contratoByPrestacao.saldoKwh;
                    await prismaClient.contrato.update({
                        where: { id: contratoByPrestacao.id },
                        data: { saldoKwh: 0 }
                    });

                    valorAdicional = excesso * predioApt.kwhPrice;
                }
            }

            await prismaClient.prestacaoAluguel.update({
                where: { id: prestacaoExisting.id },
                data: {
                    consumoKWh: consumoKWh,
                    valorExcedenteKWh: valorAdicional
                }
            });

        } catch (error) {
            console.error(error);
            throw new Error('Erro ao atualizar prestação');
        }
    }

    async registrarPagamento(prestacaoId: string) {
        const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacaoExisting) {
            throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
        }

        if (prestacaoExisting.statusPagamento === StatusPagamento.PAGO || prestacaoExisting.statusPagamento === StatusPagamento.CANCELADO) {
            throw new Error('Prestação já se encontra fechada no sistema.');
        }

        await prismaClient.prestacaoAluguel.update({
            where: {
                id: prestacaoId
            },
            data: {
                statusPagamento: StatusPagamento.AGUARDANDO
            }
        });
    }

    async aprovaPagamento(prestacaoId: string) {
        const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacaoExisting) {
            throw new Error('Prestação de aluguel nao encontrada no banco de dados.');
        }

        if (prestacaoExisting.statusPagamento === StatusPagamento.PAGO || prestacaoExisting.statusPagamento === StatusPagamento.CANCELADO) {
            throw new Error('Prestação já se encontra fechada no sistema.');
        }

        if (prestacaoExisting.statusPagamento === StatusPagamento.AGUARDANDO) {
            await prismaClient.prestacaoAluguel.update({
                where: {
                    id: prestacaoId
                },
                data: {
                    statusPagamento: StatusPagamento.PAGO
                }
            });
        } else {
            throw new Error('Prestação de aluguel não consta como paga.');
        }
    }

    async deletePrestacao(prestacaoId: string) {
        const existingPretacao = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!existingPretacao) {
            throw new Error('Prestação de aluguel não encontrado no banco de dados.');
        }

        await prismaClient.prestacaoAluguel.delete({ where: { id: prestacaoId } });
    }
}

export default PrestacaoService;