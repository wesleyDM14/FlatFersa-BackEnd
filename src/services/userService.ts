import prismaClient from "../prisma";
import { hash, compare } from "bcryptjs";
import { generateAccessToken } from "./authService";

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

    async createUser(email: string, password: string, clientId: string) {
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
                    password: passwordHash,
                    clientId: clientId
                }
            });

            return newUser;

        } catch (error) {
            throw new Error('Erro ao criar usuário: ' + error.message);
        }
    }

    async getAllUsers() {
        //Obter todos os usuários
        const users = await prismaClient.user.findMany();
        return users;
    }

    async getLoggedUserInfo(userId: string) {
        const user = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new Error('Usuário não encontrado no Banco de Dados.');
        }

        if (user.isAdmin) {
            let userAdmin = { name: 'Admin' };
            return userAdmin;
        } else {
            let userClient = await prismaClient.cliente.findFirst({ where: { id: user.clientId } });

            if (!userClient) {
                throw new Error('Usuário Cliente não encontrado no Banco de Dados');
            }

            return userClient;
        }
    }

    async getUserById(userId: string) {
        //obter usuário pelo ID
        const user = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        return user;
    }

    async updateUser(userId: string, currentPassword: string, novaSenha: string) {

        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado.');
        }

        const passwordMatch = await compare(currentPassword, existingUser.password);

        if (!passwordMatch) {
            throw new Error('Senha atual não confere.');
        }

        const passwordHash = await hash(novaSenha, 8);
        novaSenha = passwordHash;

        await prismaClient.user.update({ where: { id: userId }, data: { password: novaSenha } });

        //gerar um novo token
        const accessToken = generateAccessToken(existingUser.id);
        const isAdmin = existingUser.isAdmin;
        return { accessToken, isAdmin };
    }

    async updateClientPassword(clientId: string, currentPassword: string, novaSenha: string) {

        const existingClient = await prismaClient.cliente.findFirst({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado.');
        }

        const existingUser = await prismaClient.user.findFirst({ where: { clientId: existingClient.id } });

        const passwordHash = await hash(novaSenha, 8);

        await prismaClient.user.update({ where: { id: existingUser.id }, data: { password: passwordHash } });

        return;
    }

    async deleteUserById(userId: string) {
        //Verifica se o usuário existe
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            throw new Error('Usuário não encontrado.');
        }

        //Deletar o usuáro
        await prismaClient.user.delete({ where: { id: userId } });

        return;
    }
}

export default UserService;