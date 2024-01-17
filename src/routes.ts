import { Router } from 'express';

import { CreateUserController } from './controllers/user/CreateUserController';
import { AuthUserController } from './controllers/user/AuthUserController';

import { isAuthenticated } from './middlewares/isAuthenticated';

const router = Router();

// -- Rotas User --
router.post('/users', new CreateUserController().handle);
router.post('/session', new AuthUserController().handle);

export { router };