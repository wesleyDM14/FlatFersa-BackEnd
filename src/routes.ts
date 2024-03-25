import { Router } from 'express';

import { AuthController } from './controllers/authController';

const router = Router();

//rota de autenticação
router.post('/login', AuthController.login);

export { router };
