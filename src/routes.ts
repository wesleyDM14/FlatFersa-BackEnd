import { Router } from 'express';

import { CreateUserController } from './controllers/user/CreateUserController';
import { AuthUserController } from './controllers/user/AuthUserController';
import { DetailUserController } from './controllers/user/DetailUserController';
import { CreateClientController } from './controllers/cliente/CreateClientController';

import { isAuthenticated } from './middlewares/isAuthenticated';
import { DetailClientController } from './controllers/cliente/DetailClientController';
import { CreateApartmentController } from './controllers/apartment/CreateApartmentController';
import { DetailApartmentController } from './controllers/apartment/DetailApartmentController';
import { DeleteClientController } from './controllers/cliente/DeleteClientController';
import { DeleteApartmentController } from './controllers/apartment/DeleteApartmentController';
import { DeleteUserController } from './controllers/user/DeleteUserController';

const router = Router();

// -- Rotas User --
router.post('/users', new CreateUserController().handle);
router.get('/users', isAuthenticated, new DetailUserController().getAllUsers);
router.post('/getUser', isAuthenticated, new DetailUserController().getUserById);
router.post('/session', new AuthUserController().handle);
router.get('/me', isAuthenticated, new DetailUserController().getLoggedIn);
router.post('/deleteUser', isAuthenticated, new DeleteUserController().handle);

// -- Rotas Client --
router.post('/clients', isAuthenticated, new CreateClientController().handle);
router.get('/clients', isAuthenticated, new DetailClientController().getAll);
router.post('/deleteClient', isAuthenticated, new DeleteClientController().handle);

// -- Rotas Apartment --
router.post('/apartments', isAuthenticated, new CreateApartmentController().handle);
router.get('/apartments', isAuthenticated, new DetailApartmentController().getAll);
router.post('/deleteApartment', isAuthenticated, new DeleteApartmentController().handle);

export { router };