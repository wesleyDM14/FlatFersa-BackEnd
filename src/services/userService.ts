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
}

export default UserService;