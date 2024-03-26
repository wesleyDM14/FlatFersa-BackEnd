import { Request, Response } from "express";
import UserService from "../services/userService";

const userService = new UserService();

class UserController {

    async createUser(req: Request, res: Response) {
        try {
            const { email, password, confirmPassword } = req.body;

            //Verificar se o email e a senha foram fornecidos
            if (!email || !password) {
                return res.status(400).json({ message: 'O email e a senha são obrigatórios. ' });
            }

            //Validar Senha
            userService.validatePassword(password, confirmPassword);

            //Criar o usuário
            const newUser = await userService.createUser({ email, password });
            res.status(201).json(newUser);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getAllUsers(req: Request, res: Response) {
        try {
            //Verificar se o usuário é um administrador
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar todos os usuário.' });
            }

            //Chamar o serviço para obter todos os usuários
            const users = await userService.getAllUsers(req.user.isAdmin);

            //Retronar uma resposta com todos os usuários
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter todos os usuários.' });
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            //Extrair o ID do usuário a ser obtido a partir dos parâmetros da solicitação
            const userId = req.params.userId;

            //Chamar o serviço para obter o usuário pelo ID
            const user = await userService.getUserById(userId, req.user.id, req.user.isAdmin);

            //Retornar uma resposta com o usuário obtido
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const userId = req.params.userId;
            const { novaSenha, confirmNovaSenha } = req.body;
            const loggedInUserId = req.user.id;
            const isAdmin = req.user.isAdmin;

            userService.validatePassword(novaSenha, confirmNovaSenha);

            await userService.updateUser(userId, loggedInUserId, isAdmin, novaSenha);

            res.json({ message: 'Usuário atualizado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async deleteUserById(req: Request, res: Response) {
        try {
            //Verificar se o usuário e um administrador
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem deletar usuários.' });
            }

            //Extrair o ID do usuário a ser deletado a partir dos parâmetros da solicitação
            const userId = req.params.userId;

            //Chamar o serviço para deletar o usuário pelo ID
            await userService.deleteUserById(userId);

            //Retornar uma resposta de sucesso
            res.json({ message: 'Usuário deletado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }
}

export default UserController;