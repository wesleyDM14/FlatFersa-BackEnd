import prismaClient from "../prisma";
import dayjs from "dayjs";

class DashboardService {

    async getDashboardAdmin() {
        const ganhos = await prismaClient.prestacaoAluguel.aggregate({
            _sum: { valor: true, valorExcedenteKWh: true, multa: true },
            where: { statusPagamento: 'PAGO' }
        });

        const totalGanho =
            (ganhos._sum.valor || 0) +
            (ganhos._sum.valorExcedenteKWh || 0) +
            (ganhos._sum.multa || 0);

        const contratosAtivos = await prismaClient.contrato.count({
            where: { statusContrato: "ATIVO" }
        });

        const apartamentosOcupados = await prismaClient.apartamento.count({
            where: { status: "OCUPADO" }
        });

        const totalApartamentos = await prismaClient.apartamento.count();

        const clientesAtivos = await prismaClient.cliente.count({
            where: { statusClient: "ATIVO" }
        });

        const clientesPendentes = await prismaClient.cliente.count({
            where: { statusClient: "AGUARDANDO" }
        });

        const clientesReprovados = await prismaClient.cliente.count({
            where: { statusClient: "REPROVADO" }
        });

        const recentActivities = await prismaClient.prestacaoAluguel.findMany({
            where: { statusPagamento: "PAGO" },
            orderBy: { dataPagamento: "desc" },
            take: 5,
            select: {
                id: true,
                valor: true,
                multa: true,
                valorExcedenteKWh: true,
                dataPagamento: true,
                statusPagamento: true,
                Contract: {
                    select: {
                        id: true,
                        cliente: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        const anoAtual = dayjs().year();

        const prestacoes = await prismaClient.prestacaoAluguel.findMany({
            where: {
                dataVencimento: {
                    gte: new Date(`${anoAtual}-01-01`),
                    lt: new Date(`${anoAtual + 1}-01-01`),
                },
                statusPagamento: 'PAGO',
            },
            select: {
                dataPagamento: true,
                valor: true,
                valorExcedenteKWh: true,
                multa: true,
            },
        });

        const faturamentoPorMes = Array(12).fill(0);

        prestacoes.forEach(({ dataPagamento, valor, valorExcedenteKWh, multa }) => {
            const mesPagamento = new Date(dataPagamento).getMonth();
            faturamentoPorMes[mesPagamento] += valor + (valorExcedenteKWh || 0) + (multa || 0);
        });

        return {
            totalGanho,
            ganhoEnergia: ganhos._sum.valorExcedenteKWh || 0,
            ganhoAluguel: ganhos._sum.valor || 0,
            ganhoMultas: ganhos._sum.multa || 0,
            contratosAtivos,
            apartamentosOcupados,
            totalApartamentos,
            clientesAtivos,
            clientesPendentes,
            clientesReprovados,
            recentActivities: recentActivities.map(activity => ({
                id: activity.id,
                contrato: activity.Contract?.id || "Desconhecido",
                cliente: activity.Contract?.cliente?.name || "Desconhecido",
                valor: activity.valor + activity.multa + activity.valorExcedenteKWh,
                data: activity.dataPagamento,
                status: activity.statusPagamento
            })),
            chartData: {
                monthlyRevenue: {
                    labels: [
                        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                    ],
                    datasets: [{
                        label: 'Faturamento Mensal (R$)',
                        data: faturamentoPorMes,
                        borderColor: '#4f46e5',
                        backgroundColor: '#6366f1',
                    }],
                },
                revenueSplit: {
                    labels: ["Aluguel", "Energia", "Multas"],
                    datasets: [{
                        data: [ganhos._sum.valor || 0, ganhos._sum.valorExcedenteKWh || 0, ganhos._sum.multa || 0],
                        backgroundColor: ["#10b981", "#3b82f6", "#ef4444"]
                    }]
                },
                occupancy: {
                    labels: ["Ocupados", "Vagos"],
                    datasets: [{
                        label: "Status de Ocupação",
                        data: [apartamentosOcupados, totalApartamentos - apartamentosOcupados],
                        backgroundColor: ["#f59e0b", "#64748b"]
                    }]
                },
                clientStatus: {
                    labels: ["Ativos", "Pendentes", "Reprovados"],
                    datasets: [{
                        data: [clientesAtivos, clientesPendentes, clientesReprovados],
                        backgroundColor: ["#10b981", "#3b82f6", "#ef4444"]
                    }]
                }
            }
        };
    }

    async getDashboardClient(userId: string) {
        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId },
            select: {
                Client: true
            }
        });

        const totalParcelasPagas = await prismaClient.prestacaoAluguel.count({
            where: {
                statusPagamento: 'PAGO',
                Contract: { clientId: existingUser.Client.id }
            }
        });

        const totalParcelasPendentes = await prismaClient.prestacaoAluguel.count({
            where: {
                statusPagamento: { not: 'PAGO' },
                Contract: { clientId: existingUser.Client.id }
            }
        });

        const proximasParcelas = await prismaClient.prestacaoAluguel.findMany({
            where: {
                statusPagamento: { not: 'PAGO' },
                Contract: { clientId: existingUser.Client.id }
            },
            orderBy: { dataVencimento: 'asc' },
            take: 5,
            select: {
                id: true,
                dataVencimento: true,
                valor: true,
                statusPagamento: true
            }
        });

        return {
            chartData: {
                parcelasStatus: {
                    labels: ["Pagas", "Pendentes"],
                    datasets: [{
                        data: [totalParcelasPagas, totalParcelasPendentes],
                        backgroundColor: ["#10b981", "#ef4444"]
                    }]
                }
            },
            recentPayments: proximasParcelas.map(parcela => ({
                id: parcela.id,
                dataVencimento: parcela.dataVencimento,
                valor: parcela.valor,
                status: parcela.statusPagamento
            }))
        };
    }
}

export default DashboardService;