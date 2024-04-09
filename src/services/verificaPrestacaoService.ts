import { StatusPagamento } from "@prisma/client";
import { CronJob } from "cron";

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

const job = new CronJob('0 0 * * *', verificaPrestacoesEmAtraso);
job.start();

export { verificaPrestacoesEmAtraso }