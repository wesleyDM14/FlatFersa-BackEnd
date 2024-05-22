import { CronJob } from "cron";

import prismaClient from "../prisma";
import { StatusApartamento, StatusContrato } from "@prisma/client";

async function verificaApartamentoStatus() {
    try {
        await prismaClient.apartamento.updateMany({
            data: { status: StatusApartamento.VAGO }
        });

        const contratosAtivos = await prismaClient.contrato.findMany({ where: { statusContrato: StatusContrato.ATIVO } });

        await Promise.all(
            contratosAtivos.map(async (contrato) => {
                await prismaClient.apartamento.update({
                    where: { numeroContrato: contrato.aptId },
                    data: { status: StatusApartamento.OCUPADO }
                });
            })
        );
        console.log('Verificação dos apartamentos concluída.');

    } catch (error) {
        console.error('Erro ao verificar status dos apartamentos: ' + error.message);
    }
}

const job = new CronJob('0 0 * * *', verificaApartamentoStatus);
job.start();

export { verificaApartamentoStatus }