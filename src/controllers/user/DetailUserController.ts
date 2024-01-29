import { Request, Response } from "express";
import { DetailUserService } from "../../services/user/DetailUserService";

class DetailUserController {

    async getLoggedIn(req: Request, res: Response) {
        const user_id = req.user_id;
        const detailUserService = new DetailUserService();
        const user = await detailUserService.getUserById(user_id);

        return res.json(user);
    }

    async getUserById(req: Request, res: Response) {
        const { user_id } = req.body;
        const detailUserService = new DetailUserService();
        const user = await detailUserService.getUserById(user_id);

        return res.json(user);
    }

    async getAllUsers(req: Request, res: Response) {
        const detailUserService = new DetailUserService();
        const users = await detailUserService.getAllUser();

        return res.json(users);
    }
}

export { DetailUserController };