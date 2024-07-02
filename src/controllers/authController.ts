import { Request, Response } from "express";
import { aprovarAcessoCliente, authenticateUser, reprovarAcessoCliente, solicitarAcessoCliente } from "../services/authService";

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
            return res.status(500).json({ message: 'Erro interno do servidor: ' + error.message });
        }
    },

    async requestAccess(req: Request, res: Response) {

        try {
            const { documentFront, documentBack } = req.files as { [fieldname: string]: Express.Multer.File[] };
            const { name, cpf, rg, dateBirth, phone, address, email } = req.body;

            if (!name || !cpf || !rg || !dateBirth || !phone || !email || !documentBack || !documentFront) {
                return res.status(400).json({ message: 'Dados faltando para criação de cliente.' });
            }

            const newClient = await solicitarAcessoCliente(name, cpf, rg, dateBirth, phone, address, documentFront[0], documentBack[0], email);

            res.status(201).json(newClient);

        } catch (error) {
            console.error('Erro ao fazer solicitação: ', error);
            return res.status(500).json({ message: 'Erro interno do servidor: ' + error.message });
        }
    },

    async aproveAccess(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem aprovar clientes.' });
            }

            const { clientId } = req.body;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const newUser = await aprovarAcessoCliente(clientId);
            res.status(201).json(newUser);

        } catch (error) {
            console.error('Erro ao aprovar solicitação: ', error);
            return res.status(500).json({ message: 'Erro interno do servidor: ' + error.message });
        }
    },

    async reproveAccess(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem reprovar clientes.' });
            }

            const { clientId } = req.body;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await reprovarAcessoCliente(clientId);
            res.status(200).json({ message: 'Cliente reporvado com sucesso.' });

        } catch (error) {
            console.error('Erro ao Reprovar solicitação: ', error);
            return res.status(500).json({ message: 'Erro interno do servidor: ' + error.message });
        }
    }
}
