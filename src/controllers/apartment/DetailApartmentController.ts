import { Request, Response } from "express";
import { DetailApartmentService } from "../../services/apartment/DetailApartmentService";

class DetailApartmentController {
    async getAll(req: Request, res: Response) {
        const detailApartmentService = new DetailApartmentService();
        const apartments = await detailApartmentService.getAll();

        return res.json({ apartments });
    }
}

export { DetailApartmentController }