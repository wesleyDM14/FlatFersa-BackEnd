import { Request, Response } from "express";
import { authenticateUser } from "../services/authService";

//Controlador para lidar com as solicitações de autenticação
export const AuthController = {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            //verifica se o email e a senha foram fornecidos na solicitação
            if (!email || !password) {
                return res.status(400).json({ message: 'Email e Senha são obrigatórios' });
            }

            //Autentica o usuário e gera um token de acesso
            const accessToken = await authenticateUser(email, password);

            //Verifica se a autenticação foi bem-sucedida
            if (!accessToken) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            //Retorna o token de acesso
            return res.status(200).json({ accessToken });
        } catch (error) {
            console.error('Erro ao fazer login: ', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
}
