import prismaClient from "../prisma";

class AvisoService {

    async createAvisoGeral(title: string, content: string) {
        try {
            const users = await prismaClient.user.findMany({ where: { isAdmin: false } });

            const avisos = users.map(user => ({
                title: title,
                content: content,
                userId: user.id
            }));

            await prismaClient.avisos.createMany({
                data: avisos,
            });

            return { message: 'Avisos criados com sucesso.' };

        } catch (error) {
            throw new Error('Erro ao cadastrar avisos: ' + error.message);
        }
    }

    async createAvisoByUserId(title: string, content: string, userId: string) {
        try {
            const userExisting = await prismaClient.user.findFirst({ where: { id: userId } });

            if (!userExisting) {
                throw new Error('Usuário não encontrado no Banco de Dados.');
            }

            const aviso = await prismaClient.avisos.create({
                data: {
                    title: title,
                    content: content,
                    userId: userId
                }
            });

            return aviso;

        } catch (error) {
            throw new Error('Erro ao cadastrar avisos: ' + error.message);
        }
    }

    async getAvisos() {
        const avisos = await prismaClient.avisos.findMany();
        return avisos;
    }

    async getAvisosByUserId(userId: string) {
        try {
            const userExisting = await prismaClient.user.findFirst({ where: { id: userId } });

            if (!userExisting) {
                throw new Error('Usuário não encontrado no Banco de Dados.');
            }

            const avisos = await prismaClient.avisos.findMany({ where: { userId: userId } });

            return avisos;

        } catch (error) {
            throw new Error('Erro ao buscar avisos: ' + error.message);
        }
    }

    async updateAviso(avisoId: string, userId: string) {
        try {
            const avisoExisting = await prismaClient.avisos.findFirst({ where: { id: avisoId } });

            if (!avisoExisting) {
                throw new Error('Aviso não encontrado no Banco de Dados.');
            }

            if (avisoExisting.userId !== userId) {
                throw new Error('Somente o Usuário do Aviso pode marca-lo como lido.');
            }

            await prismaClient.avisos.update({
                where: { id: avisoId },
                data: {
                    readed: true
                }
            });

            return;

        } catch (error) {
            throw new Error('Erro ao buscar avisos: ' + error.message);
        }
    }

    async deleteAviso(avisoId: string, userId: string) {
        try {
            const avisoExisting = await prismaClient.avisos.findFirst({ where: { id: avisoId } });

            if (!avisoExisting) {
                throw new Error('Aviso não encontrado no Banco de Dados.');
            }

            const loggedUser = await prismaClient.user.findFirst({ where: { id: userId } });

            if (loggedUser.id !== avisoExisting.userId && !loggedUser.isAdmin) {
                throw new Error('Sem permição para essa operação.');
            }

            await prismaClient.avisos.delete({ where: { id: avisoExisting.id } });

            return;

        } catch (error) {
            throw new Error('Erro ao buscar avisos: ' + error.message);
        }
    }
}

export default AvisoService;