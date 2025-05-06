import { Request, Response } from "express";
import ClienteService from "../services/clienteService";

const clienteService = new ClienteService();

class ClienteController {
    async createClient(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar clientes ativos.' });
            }

            const { documentFront, documentBack } = req.files as { [fieldname: string]: Express.Multer.File[] };
            const { name, cpf, rg, dateBirth, phone, address, email } = req.body;

            if (!name || !cpf || !rg || !dateBirth || !phone || !email) {
                return res.status(400).json({ message: 'Dados faltando para criação de cliente.' });
            }

            let newClient = undefined;

            if (!documentBack && !documentFront) {
                newClient = await clienteService.createClient(name, cpf, rg, dateBirth, phone, address, undefined, undefined, email);
            } else {
                newClient = await clienteService.createClient(name, cpf, rg, dateBirth, phone, address, documentFront[0], documentBack[0], email);
            }

            res.status(201).json(newClient);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getAllClients(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar todos os clientes.' });
            }
            const clientes = await clienteService.getAllClients();
            res.json(clientes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao obter todos os clientes: ' + error.message });
        }
    }

    async getClientById(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const client = await clienteService.getClientById(clientId, req.user.id, req.user.isAdmin);
            res.json(client);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async updateClient(req: Request, res: Response) {
        try {
            //Extrair o ID do usuário a ser obtido a partir dos parâmetros da solicitação
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const { name, cpf, rg, dateBirth, phone, address } = req.body;

            const documentFront = files?.documentFront ? files.documentFront[0] : undefined;
            const documentBack = files?.documentBack ? files.documentBack[0] : undefined;

            await clienteService.updateClient(clientId, req.user.id, req.user.isAdmin, name, cpf, rg, dateBirth, phone, address, documentFront, documentBack);

            res.json({ message: 'Cliente atualizado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async deleteClient(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem deletar clientes.' });
            }

            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await clienteService.deleteClient(clientId);
            res.json({ message: 'Cliente deletado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async getDocumentoFrente(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const { stream, contentType, fileName } = await clienteService.getDocumentFrente(clientId);
            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
            stream.pipe(res);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async getDocumentoVerso(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const { stream, contentType, fileName } = await clienteService.getDocumentVerso(clientId);
            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
            stream.pipe(res);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }
}

export default ClienteController;