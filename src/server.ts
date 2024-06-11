import express, { Request, Response, NextFunction } from "express";
import 'express-async-errors';
import cors from 'cors';

import { router } from "./routes";
import { verificaPrestacoesEmAtraso, aplicarMulta } from "./functions/verificaPrestacaoService";
import { verificaApartamentoStatus } from "./functions/verificaApartamento";
import { verificaContratos } from "./functions/verificaContratos";
import { clearDirectory } from "./functions/clearUploadsFolder";
import { setupGracefulShutdown } from "./functions/shutdown";
import prismaClient from "./prisma";

const app = express();
const PORT = process.env.PORT || 3333;

//Middleware para analisar o corpo das solicitações como JSON
app.use(express.json());

//Middleware para permitir solicitações de origens diferentes
app.use(cors());

//Middleware para registrar as rotas
app.use('/api', router);

//Middleware para tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Ocorreu um erro no servidor' });
});

//Rota de teste
app.get('/teste', (req, res) => {
    res.send('Servidor rodando!');
});

verificaContratos();
verificaPrestacoesEmAtraso();
aplicarMulta();
verificaApartamentoStatus();
clearDirectory();

//Inicia o servidor
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

//Configura desligamento gracioso
setupGracefulShutdown(server, prismaClient);