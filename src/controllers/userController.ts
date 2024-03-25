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
}

export default UserController;