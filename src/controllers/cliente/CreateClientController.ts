import { Request, Response } from "express";
import { CreateClientService } from "../../services/cliente/CreateClientService";

class CreateClientController {
    async handle(req: Request, res: Response) {
        const { cpf, rg, dateBirth, phone, address, email, name } = req.body;

        const createClientService = new CreateClientService();

        const client = await createClientService.execute({ cpf, rg, dateBirth, phone, address, email, name });

        return res.json(client);
    }
}

export { CreateClientController };