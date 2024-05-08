import prismaClient from "../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";

//Função para gerar um token de acesso
export const generateAccessToken = (userID: string): string => {
    return sign({ id: userID }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

//funcao para autenticar o usuário e gerar um token de acesso
export const authenticateUser = async (email: string, password: string) => {
    try {
        //verifica se o usuário com o email fornecido existe no banco de dados
        const user = await prismaClient.user.findFirst({
            where: {
                email: email
            }
        });

        if (!user) {
            return null; //Usuário não encontrado
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return null; //Senha incorreta
        }

        //Gera e retorna um token de acesso se a autenticação for bem-sucedida
        const accessToken = generateAccessToken(user.id);
        const isAdmin = user.isAdmin;
        return { accessToken, isAdmin };

    } catch (error) {
        console.error('Error ao autenticar usuário: ', error);
        throw new Error('Erro ao autenticar usuário');
    }
}
