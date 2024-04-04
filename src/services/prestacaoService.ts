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

    async getPrestacoesByContratoId(contratoId: string) {
        const contractAlreadyExisting = await prismaClient.contrato.findFirst({ where: { id: contratoId } });

        if (!contractAlreadyExisting) {
            throw new Error('Contrato não encontrado no Banco de Dados.');
        }

        const prestacoes = await prismaClient.prestacaoAluguel.findMany({ where: { contractId: contratoId } });

        return prestacoes;
    }

    async getPrestacoesByMounth(mesReferencia: number) {
        const prestacoes = await prismaClient.prestacaoAluguel.findMany({ where: { mesReferencia: mesReferencia } });
        return prestacoes;
    }

}

export default PrestacaoService;