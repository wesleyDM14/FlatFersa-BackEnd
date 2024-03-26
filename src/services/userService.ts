import prismaClient from "../prisma";
import { hash } from "bcryptjs";

interface UserRequest {
    email: string,
    password: string,
}

class UserService {

    validatePassword(password: string, confirmPassword: string): void {
        //verificar se as senhas são iguais
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }

        //verificar se a senha atende aos requisitos mínimos
        const minimumLength = 8;
        if (password.length < minimumLength) {
            throw new Error(`A senha deve ter pelo menos ${minimumLength} caracteres.`);
        }
    }

    async createUser({ email, password }: UserRequest) {
        try {
            //verificar se o usuário ja existe
            const existingUser = await prismaClient.user.findUnique({
                where: {
                    email: email,
                }
            });

            if (existingUser) {
                throw new Error('O email já está sendo usado por outro usuário.');
            }

            //Criptografar senha
            const passwordHash = await hash(password, 8);

            //Criar novo usuário
            const newUser = await prismaClient.user.create({
                data: {
                    email: email,
                    password: passwordHash
                }
            });

            return newUser;

        } catch (error) {
            throw new Error('Erro ao criar usuário: ' + error.message);
        }
    }

    async getAllUsers(isAdmin: boolean) {
        //Verifica se o usuário é um administrador
        if (!isAdmin) {
            throw new Error('Apenas administradores podem acessar todos os usuários.');
        }

        //Obter todos os usuários
        const users = await prismaClient.user.findMany();

        return users;
    }

    async getUserById(userId: string, requesterId: string, isAdmin: boolean) {
        //Verificar se o usuário é o próprio usuário ou um administrador
        if (userId !== requesterId && !isAdmin) {
            throw new Error('Você não tem permissão para acessar este usuário.');
        }

        //obter usuário pelo ID
        const user = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        return user;
    }

    async updateUser(userId: string, loggedInUserId: string, isAdmin: boolean, novaSenha: string) {

        if (userId !== loggedInUserId && !isAdmin) {
            throw new Error('Você não tem permissão para acessar este usuário.');
        }
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            throw new Error('Usuário não encontrado.');
        }

        const passwordHash = await hash(novaSenha, 8);
        novaSenha = passwordHash;

        await prismaClient.user.update({ where: { id: userId }, data: { password: novaSenha } });
    }

    async deleteUserById(userId: string) {
        //Verifica se o usuário existe
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            throw new Error('Usuário não encontrado.');
        }

        //Deletar o usuáro
        await prismaClient.user.delete({ where: { id: userId } });
    }
}

export default UserService;