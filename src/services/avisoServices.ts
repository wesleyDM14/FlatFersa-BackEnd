import prismaClient from "../prisma";

class AvisoService {

    async createAvisoGeral(title: string, content: string) {
        try {
            const users = await prismaClient.user.findMany({ where: { isAdmin: false } });

            for (let index = 0; index < users.length; index++) {
                const user = users[index];
                
                
            }
        } catch (error) {
            throw new Error('Erro ao cadastrar avisos: ' + error.message);
        }
    }

    async createAvisoByUserId() {

    }

    async getAvisos() {

    }

    async getAvisosByUserId(userId: string) {

    }

    async updateAviso(avisoId: string) {

    }

    async deleteAviso(avisoId: string) {

    }
}

export default AvisoService;