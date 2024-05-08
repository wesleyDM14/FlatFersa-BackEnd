import express, { Request, Response, NextFunction } from "express";
import 'express-async-errors';
import cors from 'cors';

import { router } from "./routes";
import { verificaPrestacoesEmAtraso, aplicarMulta } from "./services/verificaPrestacaoService";
import { gerarContratoPDF } from "./services/gerarContratoPDF";

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

app.get('/testePDF/:contratoId', async (req, res) => {
    const contratoId = req.params.contratoId;
    const stream = res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=contrato.pdf",
    });
    await gerarContratoPDF(contratoId,
        (data) => stream.write(data),
        () => stream.end()
    );
    
    res.send('invoice');
});

verificaPrestacoesEmAtraso();
aplicarMulta();

//Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
