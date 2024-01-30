import prismaClient from "../../prisma";

class ClientRequest {
    client_id: string
}
class DeleteClientService {
    async execute({ client_id }: ClientRequest) {
        if (!client_id) {
            throw new Error('ID Inválido');
        }

        const clientAlreadyExists = await prismaClient.client.findFirst({
            where: {
                id: client_id
            }
        });

        if (clientAlreadyExists) {
            await prismaClient.client.delete({ where: { id: client_id } });
        } else {
            throw new Error('Cliente não existe');
        }

        return { message: 'sucess' };
    }
}

export { DeleteClientService }