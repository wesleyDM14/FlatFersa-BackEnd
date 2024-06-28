import prismaClient from "../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import axios from 'axios';
import fs from 'fs';
import { hash } from "bcryptjs";

import getToken from "../functions/getToken";
import { StatusCliente } from "@prisma/client";

//Função para gerar um token de acesso
export const generateAccessToken = (userID: string): string => {
    return sign({ id: userID }, process.env.JWT_SECRET /*, { expiresIn: '30d' }*/);
}

//funcao para autenticar o usuário e gerar um token de acesso
export const authenticateUser = async (email: string, password: string) => {
    try {
        //verifica se o usuário com o email fornecido existe no banco de dados
        const user = await prismaClient.user.findFirst({
            where: {
                email: email
            }
        });

        if (!user) {
            return null; //Usuário não encontrado
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return null; //Senha incorreta
        }

        //Gera e retorna um token de acesso se a autenticação for bem-sucedida
        const accessToken = generateAccessToken(user.id);
        const isAdmin = user.isAdmin;
        return { accessToken, isAdmin };

    } catch (error) {
        console.error('Error ao autenticar usuário: ', error);
        throw new Error('Erro ao autenticar usuário');
    }
}

export const solicitarAcessoCliente = async (name: string, cpf: string, rg: string, dateBirth: Date, phone: string, address: string, documentoFrente: Express.Multer.File, documentoVerso: Express.Multer.File, email: string) => {
    try {
        const existingClient = await prismaClient.cliente.findFirst({
            where: {
                OR: [
                    {
                        cpf: cpf
                    },
                    {
                        rg: rg
                    },
                    {
                        email: email
                    }
                ]
            }
        });

        if (existingClient) {
            throw new Error('O cliente já está cadastrado no banco de dados.');
        }

        const existingUser = await prismaClient.user.findFirst({
            where: {
                email: email,
            }
        });

        if (existingUser) {
            throw new Error('O email já está sendo usado por outro usuário.');
        }

        const uploadedFiles = [];

        if (documentoFrente && documentoVerso) {
            const token = await getToken();
            try {
                //upload document
                const responseFront = await axios.post(
                    `${process.env.WORDPRESS_URL}/wp-json/wp/v2/media`,
                    fs.createReadStream(documentoFrente.path),
                    {
                        headers: {
                            'Content-Disposition': `attachment; filename="${documentoFrente.originalname}"`,
                            'Content-Type': documentoFrente.mimetype,
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                fs.unlinkSync(documentoFrente.path);
                uploadedFiles.push(responseFront.data.source_url);

                const responseBack = await axios.post(
                    `${process.env.WORDPRESS_URL}/wp-json/wp/v2/media`,
                    fs.createReadStream(documentoVerso.path),
                    {
                        headers: {
                            'Content-Disposition': `attachment; filename="${documentoVerso.originalname}"`,
                            'Content-Type': documentoVerso.mimetype,
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                fs.unlinkSync(documentoVerso.path);
                uploadedFiles.push(responseBack.data.source_url);

            } catch (err) {
                throw new Error('Error uploading files to WordPress. ' + err.message);
            }
        }

        const newClientSolicitacao = await prismaClient.cliente.create({
            data: {
                name: name,
                email: email,
                cpf: cpf,
                rg: rg,
                dateBirth: dateBirth,
                phone: phone,
                address: address,
                documentoFrente: uploadedFiles[0],
                documentoVerso: uploadedFiles[1],
                statusClient: StatusCliente.AGUARDANDO,
            }
        });

        return { cliente: newClientSolicitacao }

    } catch (error) {
        throw new Error('Erro na solicitação de cliente: ' + error.message);
    }
}

export const aprovarAcessoCliente = async (clientId: string) => {
    try {
        const existingClient = await prismaClient.cliente.findFirst({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.statusClient !== StatusCliente.AGUARDANDO) {
            throw new Error('Cliente não requer aprovação.');
        }

        const passwordHash = await hash(existingClient.cpf, 8);

        try {

            await prismaClient.$transaction(async (prisma) => {

                await prisma.cliente.update({
                    where: { id: existingClient.id },
                    data: { statusClient: StatusCliente.ATIVO }
                });

                const newUser = await prisma.user.create({
                    data: {
                        email: existingClient.email,
                        password: passwordHash,
                        clientId: existingClient.id
                    }
                });

                //feedback?

                return { user: newUser }
            });

        } catch (error) {
            throw new Error('Erro ao aprovar acesso de cliente: ' + error.message);
        }

    } catch (error) {
        throw new Error('Erro em aprovar acesso do cliente: ' + error.message);
    }
}

export const reprovarAcessoCliente = async (clientId: string) => {
    try {
        const existingClient = await prismaClient.cliente.findFirst({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.statusClient !== StatusCliente.AGUARDANDO) {
            throw new Error('Cliente não requer aprovação.');
        }

        await prismaClient.cliente.update({
            where: { id: clientId },
            data: { statusClient: StatusCliente.REPROVADO }
        });

        //feedback?
    } catch (error) {
        throw new Error('Erro em reprovar acesso do cliente: ' + error.message);
    }
}
