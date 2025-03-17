import { addDays } from "date-fns";
import prismaClient from "../prisma";
import { EmailService } from "./emailService";
import { EmailTemplates } from "./email-templates";

const emailService = new EmailService();

async function notifyAdminPrestacao() {
    try {
        const today = new Date();
        const targetDateAdmin = addDays(today, 7);

        const adminNotifications = await prismaClient.prestacaoAluguel.findMany({
            where: {
                AND: [
                    {
                        dataVencimento: {
                            gte: today,
                            lte: targetDateAdmin
                        }
                    },
                    { statusPagamento: 'PENDENTE' },
                    {
                        OR: [
                            { notificadoAdminEm: null },
                            {
                                AND: [
                                    { notificacaoStatus: 'FALHA' },
                                    { tentativasAdmin: { lt: 3 } }
                                ]
                            }
                        ]
                    }
                ]
            },
            include: {
                Contract: {
                    include: {
                        cliente: true,
                        apt: { include: { predio: true } }
                    }
                }
            }
        });

        for (const prestacao of adminNotifications) {
            try {
                const adminLink = `https://app.flatfersa.com.br/prestacao/${prestacao.id}`;
                const aptDetails = `Apto ${prestacao.Contract.apt?.numero} - ${prestacao.Contract.apt?.predio.nome}`;

                await emailService.sendEmail({
                    to: process.env.ADMIN_EMAIL,
                    subject: `Leitura de Energia Pendente - ${aptDetails}`,
                    html: EmailTemplates.ADMIN_LEITURA_ENERGIA(
                        prestacao.Contract.cliente.name,
                        aptDetails,
                        adminLink,
                        prestacao.dataVencimento.toLocaleDateString('pt-BR')
                    )
                });

                await prismaClient.prestacaoAluguel.update({
                    where: { id: prestacao.id },
                    data: {
                        notificadoAdminEm: new Date(),
                        notificacaoStatus: 'ENVIADA',
                        tentativasAdmin: { increment: 1 }
                    }
                });

            } catch (error) {
                await prismaClient.prestacaoAluguel.update({
                    where: { id: prestacao.id },
                    data: {
                        notificacaoStatus: 'FALHA',
                        tentativasAdmin: { increment: 1 }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erro no serviço:', error);
    }
}

async function notifyClientPrestacao() {
    try {
        const today = new Date();

        const targetDateClient = addDays(today, 3);

        const clientNotifications = await prismaClient.prestacaoAluguel.findMany({
            where: {
                AND: [
                    {
                        dataVencimento: {
                            gte: today,
                            lte: targetDateClient
                        }
                    },
                    { statusPagamento: 'PENDENTE' },
                    {
                        OR: [
                            { notificadoClientEm: null },
                            {
                                AND: [
                                    { notificacaoStatus: 'FALHA' },
                                    { tentativasClient: { lt: 3 } }
                                ]
                            }
                        ]
                    }
                ]
            },
            include: {
                Contract: {
                    include: {
                        cliente: true,
                        apt: true
                    }
                }
            }
        });

        for (const prestacao of clientNotifications) {
            try {
                const paymentLink = `https://app.flatfersa.com.br/prestacao/${prestacao.id}`;
                const total = prestacao.valor + prestacao.valorExcedenteKWh + prestacao.multa;

                await emailService.sendEmail({
                    to: prestacao.Contract.cliente.email,
                    subject: `Pagamento Próximo do Vencimento - ${prestacao.dataVencimento.toLocaleDateString('pt-BR')}`,
                    html: EmailTemplates.CLIENTE_VENCIMENTO_PROXIMO(
                        prestacao.Contract.cliente.name,
                        prestacao.dataVencimento.toLocaleDateString('pt-BR'),
                        total,
                        paymentLink
                    )
                });

                await prismaClient.prestacaoAluguel.update({
                    where: { id: prestacao.id },
                    data: {
                        notificadoClientEm: new Date(),
                        notificacaoStatus: 'ENVIADA',
                        tentativasClient: { increment: 1 }
                    }
                });
            } catch (error) {
                await prismaClient.prestacaoAluguel.update({
                    where: { id: prestacao.id },
                    data: {
                        notificacaoStatus: 'FALHA',
                        tentativasClient: { increment: 1 }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erro no serviço:', error);
    }
}

export { notifyAdminPrestacao, notifyClientPrestacao };