import { Router } from 'express';

import { authenticateUser, isAdmin } from './middlewares/authMiddleware';
import { AuthController } from './controllers/authController';
import UserController from './controllers/userController';

const router = Router();
const userController = new UserController();

//rota de autenticação
router.post('/login', AuthController.login);

//Routa para obter todos os usuários (apenas admin tem acesso)
router.get('/users', authenticateUser, isAdmin, userController.getAllUsers.bind(userController));

//Rota para obter um usuário por ID (o próprio usuário ou administradores têm acesso)
router.get('/users/:userId', authenticateUser, userController.getUserById.bind(userController));

//Rota para deletar um usuário por ID (apenas administradores podem realizar esta ação)
router.delete('/users/:userId', authenticateUser, isAdmin, userController.deleteUserById.bind(userController));

//Rota para atualizar um usuário por ID
router.put('/users/:userId', authenticateUser, userController.updateUser.bind(userController));

export { router };
