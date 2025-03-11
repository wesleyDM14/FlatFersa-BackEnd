import { Request, Response } from "express";
import DashboardService from "../services/dashboardService";

const dashboardService = new DashboardService();

class DashboardController {

    async getDashboardAdmin(req: Request, res: Response) {
        try {
            const metrics = await dashboardService.getDashboardAdmin();
            return res.json(metrics);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

    async getDashboardClient(req: Request, res: Response) {
        try {
            const metrics = await dashboardService.getDashboardClient(req.user.id);
            return res.json(metrics);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }

}

export default DashboardController;