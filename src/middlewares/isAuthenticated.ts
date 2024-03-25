import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import prismaClient from '../prisma';

interface Payload {
    sub: string;
}

export function isLoggedIn(
    req: Request,
    res: Response,
    next: NextFunction
) {
    //receber o token
    const authToken = req.headers.authorization;

    if (!authToken) {
        return res.status(401).end();
    }

    const [, token] = authToken.split(" ");

    try {
        //validar token
        const validation = verify(
            token,
            process.env.JWT_SECRET
        ) as Payload;

        req.user_id = validation.sub;

        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Token de Acesso Inválido' });
    }
}

export async function isAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await prismaClient.user.findFirst({ where: { id: req.user_id } });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não Encontrado' });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Acessp negado: permissões insuficientes' });
        }
    } catch (error) {

    }
}