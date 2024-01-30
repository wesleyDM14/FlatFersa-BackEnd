import prismaClient from "../../prisma";

class DetailApartmentService {
    async getAll() {
        const apartments = await prismaClient.apartment.findMany();
        return apartments;
    }
}

export { DetailApartmentService }