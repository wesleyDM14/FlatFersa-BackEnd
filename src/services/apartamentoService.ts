import prismaClient from "../prisma";

class ApartamentoService {

    async createApartamento(numeroContrato: string, numero: number, valorBase: number, climatizado: boolean, predioId: string) {
        try {
            const newApartamento = await prismaClient.apartamento.create({
                data: {
                    numeroContrato: numeroContrato,
                    numero: numero,
                    valorBase: valorBase,
                    climatizado: climatizado,
                    id_predio: predioId
                }
            });

            return newApartamento;

        } catch (error) {
            throw new Error('Erro ao cadastrar apartamento: ' + error.message);
        }
    }

    async getApartamentos() {
        const apartamentos = await prismaClient.apartamento.findMany();
        return apartamentos;
    }

    async getApartamentoById(apartamentoId: string) {
        const apartamento = await prismaClient.apartamento.findFirst({ where: { numeroContrato: apartamentoId } });

        if (!apartamento) {
            throw new Error('Apartamento não encontrado.');
        }

        return apartamento;
    }

    async updateApartamento(apartamentoId: string, climatizado: boolean, valorBase: number) {
        const existingApartamento = await prismaClient.apartamento.findFirst({ where: { numeroContrato: apartamentoId } });

        if (!existingApartamento) {
            throw new Error('Apartamento não encontrado.');
        }

        await prismaClient.apartamento.update({
            where: {
                numeroContrato: apartamentoId
            },
            data: {
                climatizado: climatizado,
                valorBase: valorBase
            }
        });
    }

    async deleteApartamento(apartamentoID: string) {
        const existingApartamento = await prismaClient.apartamento.findFirst({ where: { numeroContrato: apartamentoID } });

        if (!existingApartamento) {
            throw new Error('Apartamento não encontrado.');
        }

        await prismaClient.apartamento.delete({ where: { numeroContrato: apartamentoID } });
    }
}

export default ApartamentoService;