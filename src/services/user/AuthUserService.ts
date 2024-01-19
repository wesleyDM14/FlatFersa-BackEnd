import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from 'jsonwebtoken';

interface AuthRequest {
    email: string;
    password: string;
}

class AuthUserService {
    async execute({ email, password }: AuthRequest) {
        //verifica se o email existe
        const user = await prismaClient.user.findFirst({
            where: {
                email: email
            }
        });

        if (!user) {
            throw new Error("Email ou senha incorreto");
        }

        //verificar se senha esta correta
        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            throw new Error("Email ou senha incorreto");
        }

        let userAdmin = false;
        
        const userIsAdmin = await prismaClient.admin.findFirst({
            where:{
                id: user.id
            }
        });

        if (userIsAdmin){
            userAdmin = true;
        }

        //gerar um token JWT
        const token = sign(
            {
                name: user.name,
                email: user.email,
                admin: userAdmin
            },
            process.env.JWT_SECRET,
            {
                subject: user.id,
                expiresIn: '30d'
            }
        );

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: token
        }
    }
}

export { AuthUserService };