import { StatusPagamento } from "@prisma/client";
import { CronJob } from "cron";

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

    async getPrestacaoByUserId(clientId: string, userId: string) {
        const clientAlreadyExisting = await prismaClient.cliente.findFirst({ where: { id: clientId } });
        console.log(clientAlreadyExisting);
        if (!clientAlreadyExisting) {
            throw new Error('Cliente não encontrado no Banco de Dados.');
        }

        const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

        const contractAlreadyExisting = await prismaClient.contrato.findFirst({ where: { clientId: clientAlreadyExisting.id } });
        console.log(contractAlreadyExisting);
        if (contractAlreadyExisting.clientId !== userLoggedIn.clientId) {
            throw new Error('Você não tem permissão para acessar este contrato.');
        }

        const prestacoes = await prismaClient.prestacaoAluguel.findMany({ where: { contractId: contractAlreadyExisting.id } });
        console.log(prestacoes);
        return prestacoes;
    }

    async getPrestacoesByMounth(mesReferencia: number) {
        const prestacoes = await prismaClient.prestacaoAluguel.findMany({ where: { mesReferencia: mesReferencia } });
        return prestacoes;
    }

    async updatePrestacao(prestacaoId: string, consumoKWh: number) {
        const prestacaoExisting = await prismaClient.prestacaoAluguel.findFirst({ where: { id: prestacaoId } });

        if (!prestacaoExisting) {
            throw new Error('Prestação de aluguel não encontrada no banco de dados.');
        }

        const contratoByPrestacao = await prismaClient.contrato.findFirst({ where: { id: prestacaoExisting.contractId } });

        const tarifaCosern = 0.67257;
        let valorAdicional = 0;

        const valorExcedenteKWh = consumoKWh - contratoByPrestacao.limiteKwh;

        if (valorExcedenteKWh > 0) {
            valorAdicional = valorExcedenteKWh * tarifaCosern;
        }

        await prismaClient.prestacaoAluguel.update({
            where: {
                id: prestacaoId
            },
            data: {
                valorExcedenteKWh: valorAdicional,
                consumoKWh: consumoKWh
            }
        });
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