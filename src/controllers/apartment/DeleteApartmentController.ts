import { Request, Response } from "express";
import { DeleteApartmentService } from "../../services/apartment/DeleteApartmentService";

class DeleteApartmentController {
    async handle(req: Request, res: Response) {
        const { apartment_id } = req.body;

        const deleteApartmentService = new DeleteApartmentService();

        const response = await deleteApartmentService.execute({ apartment_id });

        return res.json(response);
    }
}

export { DeleteApartmentController }