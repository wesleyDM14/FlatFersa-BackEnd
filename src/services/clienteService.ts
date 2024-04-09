import prismaClient from "../prisma";
import UserService from "./userService";

class ClienteService {

    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async createClient(name: string, cpf: string, rg: string, dateBirth: Date, phone: string, address: string, documentoFrente: string, documentoVerso: string, email: string) {
        try {
            const existingClient = await prismaClient.cliente.findFirst({
                where: {
                    OR: [
                        {
                            cpf: cpf
                        },
                        {
                            rg: rg
                        }
                    ]
                }
            });

            if (existingClient) {
                throw new Error('O cliente já está cadastrado no banco de dados.');
            }

            const existingUser = await prismaClient.user.findUnique({
                where: {
                    email: email,
                }
            });

            if (existingUser) {
                throw new Error('O email já está sendo usado por outro usuário.');
            }

            try {
                const transaction = await prismaClient.$transaction(async (prisma) => {
                    const newClient = await prisma.cliente.create({
                        data: {
                            name: name,
                            cpf: cpf,
                            rg: rg,
                            dateBirth: dateBirth,
                            phone: phone,
                            address: address,
                            documentoFrente: documentoFrente,
                            documentoVerso: documentoVerso
                        }
                    });

                    const newUser = await this.userService.createUser(email, cpf, newClient.id);
                    return { cliente: newClient, user: newUser }
                });
            } catch (error) {
                throw new Error('Erro ao criar cliente e usuário: ' + error.message);
            }

        } catch (error) {
            throw new Error('Erro na criação de usuário e cliente: ' + error.message);
        }
    }

    async getAllClients() {
        const clients = await prismaClient.cliente.findMany();
        return clients;
    }

    async getClientById(clientId: string, userId: string, isAdmin: boolean) {

        const user = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        if (clientId !== user.clientId && !isAdmin) {
            throw new Error('Acesso negado!');
        }

        const client = await prismaClient.cliente.findFirst({ where: { id: clientId } });

        if (!client) {
            throw new Error('Cliente não encontrado.');
        }

        return client;
    }

    async updateClient(clientId: string, userId: string, isAdmin: boolean, dadosAtualizados: any) {
        try {
            //Verifica se o cliente existe
            const clientExisting = await prismaClient.cliente.findUnique({ where: { id: clientId } });
            if (!clientExisting) {
                throw new Error('Cliente não encontrado.');
            }

            const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

            if (clientId !== userLoggedIn.clientId && !isAdmin) {
                throw new Error('Você não tem permissão para acessar este contrato.');
            }

            //Remove campos nulos dos dados atualizados
            const dadosParaAtualizar = Object.fromEntries(
                Object.entries(dadosAtualizados).filter(([_, valor]) => valor !== null)
            );

            //Atualiza o cliente com os dados fornecidos
            await prismaClient.cliente.update({
                where: { id: clientId },
                data: dadosParaAtualizar,
            });

        } catch (error) {
            throw new Error('Erro no processo de atualizar cliente: ' + error.message);
        }
    }

    async deleteClient(clientId: string) {
        const existingClient = await prismaClient.cliente.findFirst({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado.');
        }

        await prismaClient.cliente.delete({ where: { id: clientId } });
    }
}

export default ClienteService;