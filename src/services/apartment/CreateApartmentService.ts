import prismaClient from "../../prisma";

interface ApartmentRequest {
    number: number,
    baseValue: number,
    building?: string
}

class CreateApartmentService {
    async execute({ number, baseValue, building }: ApartmentRequest) {

        const apartmentAlreadyExists = await prismaClient.apartment.findFirst({
            where: {
                number: number
            }
        });

        if (apartmentAlreadyExists && apartmentAlreadyExists.building.toLowerCase() === building.toLowerCase()) {
            throw new Error("Apartamento já cadastrado");
        }

        const apartment = await prismaClient.apartment.create({
            data: {
                number: number,
                baseValue: baseValue,
                building: building,
            }
        });

        return apartment;
    }
}

export { CreateApartmentService }