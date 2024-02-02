import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

interface Payload {
    sub: string;
    admin: boolean;
}

export function isAuthenticated(
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
        req.user_admin = validation.admin;

        return next();
    } catch (err) {
        return res.status(401).end();
    }
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
        return res.status(401).end();
    }
}