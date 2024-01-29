import prismaClient from "../../prisma";
import { CreateUserService } from "../user/CreateUserService";

interface ClientRequest {
    cpf: string,
    rg: string,
    dateBirth: Date,
    phone: string,
    address: string,
    email: string,
    name: string,
}

class CreateClientService {
    async execute({ cpf, rg, dateBirth, phone, address, email, name }: ClientRequest) {
        if (!cpf || !rg) {
            throw new Error("CPF inválido");
        }
        if (!email) {
            throw new Error("Email inválido");
        }

        const clientAlreadyExists = await prismaClient.client.findFirst({
            where: {
                cpf: cpf
            }
        });

        if (clientAlreadyExists) {
            throw new Error("Cliente já existe");
        }

        let password = cpf;

        const createUserService = new CreateUserService();

        const user = await createUserService.execute({ email, name, password });

        const client = await prismaClient.client.create({
            data: {
                cpf: cpf,
                name: name,
                rg: rg,
                dateBirth: dateBirth,
                phone: phone,
                address: address,
                id: user.id
            }
        });

        return client;
    }
}

export { CreateClientService };