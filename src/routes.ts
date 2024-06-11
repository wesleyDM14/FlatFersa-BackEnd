import { Router } from 'express';

import { authenticateUser, isAdmin } from './middlewares/authMiddleware';
import uploadFieldsClient from './middlewares/uploadClientMiddleware.ts';
import { AuthController } from './controllers/authController';

import UserController from './controllers/userController';
import PredioController from './controllers/predioController';
import ApartamentoController from './controllers/apartamentoController';
import ClienteController from './controllers/clienteController';
import ContratoController from './controllers/contratoController';
import PrestacaoController from './controllers/prestacaoController';
import AvisoController from './controllers/avisoController';

const router = Router();
const userController = new UserController();
const predioController = new PredioController();
const apartamentoController = new ApartamentoController();
const clienteController = new ClienteController();
const contratoController = new ContratoController();
const prestacaoController = new PrestacaoController();
const avisoController = new AvisoController();

//rota de autenticação
router.post('/login', AuthController.login);

//CRUD para PREDIO
router.post('/predios', authenticateUser, isAdmin, predioController.createPredio.bind(predioController));
router.get('/predios', authenticateUser, isAdmin, predioController.getPredios.bind(predioController));
router.get('/predios/:predioId', authenticateUser, isAdmin, predioController.getPredioById.bind(predioController));
router.put('/predios/:predioId', authenticateUser, isAdmin, predioController.updatePredio.bind(predioController));
router.delete('/predios/:predioId', authenticateUser, isAdmin, predioController.deletePredio.bind(predioController));

//CRUD para APARTAMENTO
router.post('/apartamentos', authenticateUser, isAdmin, apartamentoController.createApartamento.bind(apartamentoController));
router.get('/apartamentos', authenticateUser, apartamentoController.getApartamentos.bind(apartamentoController));
router.get('/apartamentos-infos', authenticateUser, isAdmin, apartamentoController.getApartamentosWithInofs.bind(apartamentoController));
router.get('/apartamentos/:apartamentoId', authenticateUser, apartamentoController.getApartamentoById.bind(apartamentoController));
router.put('/apartamentos/:apartamentoId', authenticateUser, isAdmin, apartamentoController.updateApartamento.bind(apartamentoController));
router.delete('/apartamentos/:apartamentoId', authenticateUser, isAdmin, apartamentoController.deleteApartamento.bind(apartamentoController));

//CRUD para USER
router.post('/users', authenticateUser, isAdmin, userController.createUser.bind(userController));
router.get('/users', authenticateUser, isAdmin, userController.getAllUsers.bind(userController));
router.get('/users/:userId', authenticateUser, userController.getUserById.bind(userController));
router.put('/users/:userId', authenticateUser, userController.updateUser.bind(userController));
router.delete('/users/:userId', authenticateUser, isAdmin, userController.deleteUserById.bind(userController));

//CRUD para CLIENTE
router.post('/clients', authenticateUser, isAdmin, uploadFieldsClient, clienteController.createClient.bind(clienteController));
router.get('/clients', authenticateUser, isAdmin, clienteController.getAllClients.bind(clienteController));
router.get('/clients/:clientId', authenticateUser, clienteController.getClientById.bind(clienteController));
router.put('/clients/:clientId', authenticateUser, clienteController.updateClient.bind(clienteController));
router.delete('/clients/:clientId', authenticateUser, isAdmin, clienteController.deleteClient.bind(clienteController));

//CRUD para CONTRATO
router.post('/contratos', authenticateUser, isAdmin, contratoController.createContrato.bind(contratoController));
router.post('/contratos/solicitar', authenticateUser, contratoController.solicitarContrato.bind(contratoController));
router.post('/contratos/aprovar', authenticateUser, isAdmin, contratoController.aprovarContrato.bind(contratoController));
router.get('/contratos/reprovar/:contratoId', authenticateUser, isAdmin, contratoController.reprovarContrato.bind(contratoController));
router.get('/contratos', authenticateUser, isAdmin, contratoController.getContratos.bind(contratoController));
router.get('/contratos-infos', authenticateUser, isAdmin, contratoController.getContratosWithInfos.bind(contratoController));
router.get('/contratos-cliente', authenticateUser, contratoController.getContratosByUserLoggedIn.bind(contratoController));
router.get('/contratos/:contratoId', authenticateUser, contratoController.getContratoById.bind(contratoController));
router.get('/contratos/download/:contratoId', authenticateUser, contratoController.downloadContratoById.bind(contratoController));
router.put('/contratos/:contratoId', authenticateUser, isAdmin, contratoController.updateContrato.bind(contratoController));
router.delete('/contratos/:contratoId', authenticateUser, isAdmin, contratoController.deleteContrato.bind(contratoController));

//CRUD para PRESTAÇÃO ALUGUEL
router.post('/aluguel', authenticateUser, isAdmin, prestacaoController.createPrestacao.bind(prestacaoController));
router.post('/aluguel/generateQrCode', authenticateUser, prestacaoController.generateQrCodePix.bind(prestacaoController));
router.get('/aluguel', authenticateUser, prestacaoController.getAllPrestacao.bind(prestacaoController));
router.get('/aluguel/:prestacaoId', authenticateUser, prestacaoController.getPrestacaoById.bind(prestacaoController));
router.get('/aluguel/contrato/:contratoId', authenticateUser, prestacaoController.getPrestacoesByContratoId.bind(prestacaoController));
router.get('/aluguel-cliente', authenticateUser, prestacaoController.getPrestacaoByUserId.bind(prestacaoController));
router.get('/aluguel/mes/:mesReferencia', authenticateUser, isAdmin, prestacaoController.getPrestacoesByMouth.bind(prestacaoController));
router.put('/aluguel/:prestacaoId', authenticateUser, isAdmin, prestacaoController.updatePrestacao.bind(prestacaoController));
router.put('/aluguel/pagamento/:prestacaoId', authenticateUser, prestacaoController.registraPagamento.bind(prestacaoController));
router.put('/aluguel/aprovar/:prestacaoId', authenticateUser, isAdmin, prestacaoController.confirmaPagamento.bind(prestacaoController));
router.delete('/aluguel/:prestacaoId', authenticateUser, isAdmin, prestacaoController.deletePrestacao.bind(prestacaoController));

//CRUD para AVISOS
router.post('/avisos/global', authenticateUser, isAdmin, avisoController.createAvisoGeral.bind(avisoController));
router.post('/avisos', authenticateUser, isAdmin, avisoController.createAvisoByUserId.bind(avisoController));
router.get('/avisos', authenticateUser, isAdmin, avisoController.getAvisos.bind(avisoController));
router.get('/avisos/:userId', authenticateUser, isAdmin, avisoController.getAvisosByUserId.bind(avisoController));
router.get('/avisos/user/', authenticateUser, avisoController.getAvisosByUserLoggedIn.bind(avisoController));
router.put('/avisos/:avisoId', authenticateUser, avisoController.updateAviso.bind(avisoController));
router.delete('/avisos/:avisoId', authenticateUser, avisoController.deleteAviso.bind(avisoController));

export { router };
