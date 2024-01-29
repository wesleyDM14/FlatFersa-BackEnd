import prismaClient from "../../prisma";

class DetailUserService {
    async getUserById(user_id: string) {
        const user = await prismaClient.user.findFirst({
            where:{
                id: user_id
            },
            select:{
                id: true,
                name: true,
                email: true,
                created_at: true,
                updated_at: true,
            }
        });

        return user;
    }

    async getAllUser() {
        const users = await prismaClient.user.findMany({
            select:{
                id: true,
                email: true,
                name: true
            }
        });
        return users;
    }
}

export { DetailUserService };