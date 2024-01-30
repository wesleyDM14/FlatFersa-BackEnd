import { Request, Response } from "express";
import { DeleteClientService } from "../../services/cliente/DeleteClientService";

class DeleteClientController {
    async handle(req: Request, res: Response) {
        const { client_id } = req.body;

        const deleteClientService = new DeleteClientService();

        const response = await deleteClientService.execute({ client_id });

        return res.json(response);
    }
}

export { DeleteClientController }