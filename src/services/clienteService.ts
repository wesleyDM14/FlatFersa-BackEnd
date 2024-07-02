import prismaClient from "../prisma";
import axios from 'axios';
import fs from 'fs';
import { hash } from "bcryptjs";

import getToken from "../functions/getToken";
import { StatusCliente } from "@prisma/client";

class ClienteService {

    async createClient(name: string, cpf: string, rg: string, dateBirth: Date, phone: string, address: string, documentoFrente: Express.Multer.File, documentoVerso: Express.Multer.File, email: string) {
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

            const existingUser = await prismaClient.user.findUnique({
                where: {
                    email: email,
                }
            });

            if (existingUser) {
                throw new Error('O email já está sendo usado por outro usuário.');
            }

            const passwordHash = await hash(cpf, 8);

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

            try {
                await prismaClient.$transaction(async (prisma) => {
                    const newClient = await prisma.cliente.create({
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
                            statusClient: StatusCliente.ATIVO,
                        }
                    });

                    const newUser = await prisma.user.create({
                        data: {
                            email: email,
                            password: passwordHash,
                            clientId: newClient.id
                        }
                    });
                    return { cliente: newClient, user: newUser }
                });
            } catch (error) {
                throw new Error('Erro ao criar cliente e usuário: ' + error.message);
            }

        } catch (error) {
            throw new Error('Erro na criação de usuário e cliente: ' + error.message);
        }
    }

    async getAllClients() {
        const clients = await prismaClient.cliente.findMany();
        return clients;
    }

    async getClientById(clientId: string, userId: string, isAdmin: boolean) {

        const user = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!user) {
            throw new Error('Usuário não encontrado no Banco de Dados.');
        }

        if (clientId !== user.clientId && !isAdmin) {
            throw new Error('Acesso negado!');
        }

        const client = await prismaClient.cliente.findFirst({ where: { id: clientId } });

        if (!client) {
            throw new Error('Cliente não encontrado no Banco de Dados.');
        }

        return client;
    }

    async updateClient(clientId: string, userId: string, isAdmin: boolean, name: string, cpf: string, rg: string, dateBirth: Date, phone: string, address: string, documentoFrente: Express.Multer.File, documentoVerso: Express.Multer.File) {
        try {
            //Verifica se o cliente existe
            const clientExisting = await prismaClient.cliente.findUnique({ where: { id: clientId } });
            if (!clientExisting) {
                throw new Error('Cliente não encontrado no Banco de dados.');
            }

            const userLoggedIn = await prismaClient.user.findFirst({ where: { id: userId } });

            if (clientId !== userLoggedIn.clientId && !isAdmin) {
                throw new Error('Você não tem permissão para acessar este cliente.');
            }

            //atualizar imagens
            let uploadedFiles = [clientExisting.documentoFrente, clientExisting.documentoVerso];

            if (documentoFrente && documentoVerso) {
                uploadedFiles = [];
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

            //Atualiza o cliente com os dados fornecidos
            await prismaClient.cliente.update({
                where: { id: clientId },
                data: {
                    name: name,
                    cpf: cpf,
                    rg: rg,
                    dateBirth: dateBirth,
                    phone: phone,
                    address: address,
                    documentoFrente: uploadedFiles[0],
                    documentoVerso: uploadedFiles[1],
                },
            });

            return;

        } catch (error) {
            throw new Error('Erro no processo de atualizar cliente: ' + error.message);
        }
    }

    async deleteClient(clientId: string) {
        const existingClient = await prismaClient.cliente.findFirst({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no Banco de Dados.');
        }

        const existingUser = await prismaClient.user.findFirst({ where: { clientId: clientId } });

        try {
            await prismaClient.$transaction(async (prisma) => {
                await prisma.cliente.delete({ where: { id: clientId } });
                await prisma.user.delete({ where: { id: existingUser.id } });
            });
        } catch (error) {
            throw new Error('Erro ao excluir cliente e usuário: ' + error.message);
        }

        return;
    }
}

export default ClienteService;