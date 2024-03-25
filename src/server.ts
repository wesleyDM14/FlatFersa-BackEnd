import express, { Request, Response, NextFunction } from "express";
import 'express-async-errors';
import cors from 'cors';

import { router } from "./routes";

const app = express();
const PORT = process.env.PORT || 3333;

//Middleware para analisar o corpo das solicitações como JSON
app.use(express.json());

//Middleware para permitir solicitações de origens diferentes
app.use(cors());

//Middleware para registrar as rotas
app.use('/api', router);

//Rota de teste
app.get('/teste', (req, res) => {
    res.send('Servidor rodando!');
});

//Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
