import { Request, Response } from "express";
import { CreateApartmentService } from "../../services/apartment/CreateApartmentService";

class CreateApartmentController {
    async handle(req: Request, res: Response) {
        const { number, baseValue, building } = req.body;

        const createApartmentService = new CreateApartmentService();

        const apartment = await createApartmentService.execute({ number, baseValue, building });

        return res.json(apartment);
    }
}

export { CreateApartmentController }