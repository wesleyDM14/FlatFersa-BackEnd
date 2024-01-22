import { Request, Response } from "express";
import { DetailClientService } from "../../services/cliente/DetailClientService";

class DetailClientController {
    async getUnique(req: Request, res: Response) {
        const { client_id } = req.body;
        const detailUserService = new DetailClientService();

        const client = await detailUserService.getUnique(client_id);

        return res.json({ client });
    }

    async getAll(req: Request, res: Response) {
        const detailClientService = new DetailClientService();
        const clients = await detailClientService.getAll();

        return res.json({ clients });
    }
}

export { DetailClientController };