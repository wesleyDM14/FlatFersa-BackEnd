import { StatusPagamento } from "@prisma/client";
import { CronJob } from "cron";
import { differenceInMonths } from "date-fns";

import prismaClient from "../prisma";

async function verificaPrestacoesEmAtraso() {
    try {
        const prestacoesEmAberto = await prismaClient.prestacaoAluguel.findMany({
            where: {
                statusPagamento: StatusPagamento.PENDENTE,
                dataVencimento: { lt: new Date() },
            }
        });

        await Promise.all(
            prestacoesEmAberto.map(async (prestacao) => {
                if (prestacao.statusPagamento !== StatusPagamento.ATRASADO) {
                    await prismaClient.prestacaoAluguel.update({
                        where: { id: prestacao.id },
                        data: { statusPagamento: StatusPagamento.ATRASADO },
                    });
                }
            })
        );

        console.log('Verificação de prestação em atraso concluída.');
    } catch (error) {
        console.error('Erro ao verificar prestações em atraso: ' + error.message);
    }
}

async function aplicarMulta() {
    try {
        const prestacoesEmAtraso = await prismaClient.prestacaoAluguel.findMany({
            where: {
                statusPagamento: StatusPagamento.ATRASADO
            }
        });

        await Promise.all(
            prestacoesEmAtraso.map(async (prestacao) => {
                const { id, valor, dataVencimento } = prestacao;

                const mesesEmAtraso = differenceInMonths(new Date(), dataVencimento);

                if (mesesEmAtraso > 0) {
                    const multa = valor * Math.pow(1 + 0.02, mesesEmAtraso);

                    await prismaClient.prestacaoAluguel.update({
                        where: {
                            id: id
                        },
                        data: {
                            multa: multa
                        }
                    });
                }
            })
        );
        console.log('Aplicação de multas concluidas.');
    } catch (error) {
        console.error('Erro ao aplicar multas nas prestações em atraso: ' + error.message);
    }
}

const job = new CronJob('0 0 * * *', verificaPrestacoesEmAtraso);
const jobMulta = new CronJob('0 0 * * *', aplicarMulta);
job.start();
jobMulta.start();

export { verificaPrestacoesEmAtraso, aplicarMulta }