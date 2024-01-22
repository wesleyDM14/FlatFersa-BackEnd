import prismaClient from "../../prisma";

class DetailClientService {
    async getAll() {
        const clients = await prismaClient.client.findMany();
        return clients;
    }

    async getUnique(client_id: string) {
        if (!client_id) {
            throw new Error("Id de cliente incorreto.")
        }

        const client = await prismaClient.client.findFirst({
            where: {
                id: client_id
            }
        });

        if (!client) {
            throw new Error("Cliente não existe.")
        }

        return client;
    }
}

export { DetailClientService };