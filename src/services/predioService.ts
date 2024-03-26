import prismaClient from "../prisma";

class PredioService {
    async createPredio(endereco: string) {
        try {
            if (!endereco) {
                throw new Error('Endereço não pode ser vazio.');
            }

            const newPredio = await prismaClient.predio.create({
                data: {
                    endereco: endereco
                }
            });

            return newPredio;

        } catch (error) {
            throw new Error('Erro ao cadastrar predio: ' + error.message);
        }
    }

    async getPredios() {
        const predios = await prismaClient.predio.findMany();
        return predios;
    }

    async getPredioById(predioId: string) {
        const predio = await prismaClient.predio.findFirst({ where: { id: predioId } });

        if (!predio) {
            throw new Error('Predio não encontrado');
        }

        return predio;
    }

    async updatePredio(predioId: string, endereco: string) {
        const existingPredio = await prismaClient.predio.findFirst({ where: { id: predioId } });

        if (!existingPredio) {
            throw new Error('Predio não encontrado.');
        }

        await prismaClient.predio.update({ where: { id: predioId }, data: { endereco: endereco } });
    }

    async deletePredio(predioId: string) {
        const existingPredio = await prismaClient.predio.findFirst({ where: { id: predioId } });
        if (!existingPredio) {
            throw new Error('O predio não foi encontrado.');
        }

        await prismaClient.predio.delete({ where: { id: predioId } });
    }
}

export default PredioService;