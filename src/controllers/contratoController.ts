import { Request, Response } from "express";
import ContratoService from "../services/contratoService";

const contratoService = new ContratoService();

class ContratoController {

    async createContrato(req: Request, res: Response) {
        //6meses
        
    }

    async getContratos(req: Request, res: Response) {

    }

    async getContratoById(req: Request, res: Response) {

    }

    async updateContrato(req: Request, res: Response) {

    }

    async deleteContrato(req: Request, res: Response) {

    }

}

export default ContratoController;