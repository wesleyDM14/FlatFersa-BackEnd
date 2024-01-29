import { Router } from 'express';

import { CreateUserController } from './controllers/user/CreateUserController';
import { AuthUserController } from './controllers/user/AuthUserController';
import { DetailUserController } from './controllers/user/DetailUserController';
import { CreateClientController } from './controllers/cliente/CreateClientController';

import { isAuthenticated } from './middlewares/isAuthenticated';
import { DetailClientController } from './controllers/cliente/DetailClientController';
import { CreateApartmentController } from './controllers/apartment/CreateApartmentController';

const router = Router();

// -- Rotas User --
router.post('/users', new CreateUserController().handle);
router.get('/users', isAuthenticated, new DetailUserController().getAllUsers);
router.post('/getUser', isAuthenticated, new DetailUserController().getUserById);
router.post('/session', new AuthUserController().handle);
router.get('/me', isAuthenticated, new DetailUserController().getLoggedIn);

// -- Rotas Client --
router.post('/clients', isAuthenticated, new CreateClientController().handle);
router.get('/clients', isAuthenticated, new DetailClientController().getAll);

// -- Rotas Apartment --
router.post('/apartments', isAuthenticated, new CreateApartmentController().handle);

export { router };