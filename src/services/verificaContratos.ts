import { CronJob } from "cron";

import prismaClient from "../prisma";
import { StatusApartamento, StatusContrato } from "@prisma/client";
import { addMonths } from "date-fns";

async function verificaContratos() {
    try {
        const today = new Date();

        const diaAtual = today.getDate();
        const mesAtual = today.getMonth();
        const anoAtual = today.getFullYear();

        const dataAtual = new Date(anoAtual, mesAtual, diaAtual);

        const contratosAtivos = await prismaClient.contrato.findMany({ where: { statusContrato: StatusContrato.ATIVO } });

        await Promise.all(
            contratosAtivos.map(async (contrato) => {
                const dataVencimento = addMonths(contrato.dataInicio, contrato.duracaoContrato);

                const diaFimContrato = dataVencimento.getDate();
                const mesFimContrato = dataVencimento.getMonth();
                const anoFimContrato = dataVencimento.getFullYear();

                const dataVencimentoStyled = new Date(anoFimContrato, mesFimContrato, diaFimContrato);

                if (dataVencimentoStyled < dataAtual) {
                    try {
                        await prismaClient.$transaction(async (prisma) => {
                            await prisma.contrato.update({
                                where: { id: contrato.id },
                                data: {
                                    statusContrato: StatusContrato.ENCERRADO,
                                }
                            });

                            await prisma.apartamento.update({
                                where: { numeroContrato: contrato.aptId },
                                data: { status: StatusApartamento.VAGO }
                            });

                            const newHistorico = await prisma.historicoLocatarios.create({
                                data: {
                                    dataEntrada: contrato.dataInicio,
                                    aptID: contrato.aptId,
                                    clienteID: contrato.clientId,
                                    motivoSaida: 'Vencimento do Contrato',
                                    dataSaida: dataAtual
                                }
                            });
                        });
                    } catch (error) {
                        throw new Error('Erro ao verificar contratos: ' + error.message);
                    }
                }
            })
        );
    } catch (error) {
        console.error('Erro ao verificar os contratos: ' + error.message);
    }
}

const job = new CronJob('0 0 * *', verificaContratos);
job.start();

export { verificaContratos }