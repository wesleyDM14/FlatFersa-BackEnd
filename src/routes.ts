import { Router } from 'express';

import { authenticateUser, isAdmin } from './middlewares/authMiddleware';
import { AuthController } from './controllers/authController';
import UserController from './controllers/userController';
import PredioController from './controllers/predioController';

const router = Router();
const userController = new UserController();
const predioController = new PredioController();

//rota de autenticação
router.post('/login', AuthController.login);

//CRUD para PREDIO
router.post('/predios', authenticateUser, isAdmin, predioController.createPredio.bind(predioController));
router.get('/predios', authenticateUser, isAdmin, predioController.getPredios.bind(predioController));
router.get('/predios/:predioId', authenticateUser, isAdmin, predioController.getPredioById.bind(predioController));
router.put('/predios/:predioId', authenticateUser, isAdmin, predioController.getPredioById.bind(predioController));
router.delete('/predios/:predioId', authenticateUser, isAdmin, predioController.deletePredio.bind(predioController));

//CRUD para USER
router.post('/users', authenticateUser, isAdmin, userController.createUser.bind(userController));
router.get('/users', authenticateUser, isAdmin, userController.getAllUsers.bind(userController));
router.get('/users/:userId', authenticateUser, userController.getUserById.bind(userController));
router.delete('/users/:userId', authenticateUser, isAdmin, userController.deleteUserById.bind(userController));
router.put('/users/:userId', authenticateUser, userController.updateUser.bind(userController));

export { router };
