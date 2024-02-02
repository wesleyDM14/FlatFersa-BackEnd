import prismaClient from "../../prisma";

class UserRequest {
    user_id: string
}
class DeleteUserService {
    async execute({ user_id }: UserRequest) {
        if (!user_id) {
            throw new Error('ID Inválido');
        }

        const userAlreadyExists = await prismaClient.user.findFirst({
            where: {
                id: user_id
            }
        });

        if (userAlreadyExists) {
            await prismaClient.user.delete({ where: { id: user_id } });
        } else {
            throw new Error('Usuário não existe');
        }

        return { message: 'sucess' };
    }
}

export { DeleteUserService }