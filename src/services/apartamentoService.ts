import prismaClient from "../prisma";

class ApartamentoService {

    async createApartamento(numero: number, valorBase: number, climatizado: boolean, predioId: string) {
        try {

            const currentPredio = await prismaClient.predio.findFirst({ where: { id: predioId } });

            if (!currentPredio) {
                throw new Error('ID de prédio não encontrado no Sistema.');
            }

            const apartamentoWithNumberExisting = await prismaClient.apartamento.findFirst({
                where: {
                    AND: [
                        {
                            id_predio: predioId
                        },
                        {
                            numero: numero
                        }
                    ]
                }
            });

            if (apartamentoWithNumberExisting) {
                throw new Error('Número de Apartamento já cadastrado neste prédio.');
            }

            const newApartamento = await prismaClient.apartamento.create({
                data: {
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
        const apartamentos = await prismaClient.apartamento.findMany({
            orderBy: {
                numero: "asc"
            }
        });
        return apartamentos;
    }

    async getApartamentosWithInfo() {
        const apartamentos = await prismaClient.apartamento.findMany({
            orderBy: {
                numero: "asc"
            }
        });
        const response = [];

        for (let index = 0; index < apartamentos.length; index++) {
            const apt = apartamentos[index];
            const predio = await prismaClient.predio.findFirst({ where: { id: apt.id_predio } });
            let aux = { apartamento: apt, predio: predio };
            response.push(aux);
        }
        return response;
    }

    async getApartamentoById(apartamentoId: string) {
        const apartamento = await prismaClient.apartamento.findFirst({ where: { id: apartamentoId } });

        if (!apartamento) {
            throw new Error('Apartamento não encontrado.');
        }

        return apartamento;
    }

    async updateApartamento(apartamentoId: string, climatizado: boolean, valorBase: number) {
        const existingApartamento = await prismaClient.apartamento.findFirst({ where: { id: apartamentoId } });

        if (!existingApartamento) {
            throw new Error('Apartamento não encontrado.');
        }

        await prismaClient.apartamento.update({
            where: {
                id: apartamentoId
            },
            data: {
                climatizado: climatizado,
                valorBase: valorBase
            }
        });
    }

    async deleteApartamento(apartamentoID: string) {
        const existingApartamento = await prismaClient.apartamento.findFirst({ where: { id: apartamentoID } });

        if (!existingApartamento) {
            throw new Error('Apartamento não encontrado.');
        }

        await prismaClient.apartamento.delete({ where: { id: apartamentoID } });
    }
}

export default ApartamentoService;