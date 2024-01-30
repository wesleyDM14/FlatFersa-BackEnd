import prismaClient from "../../prisma";

class ApartmentRequest {
    apartment_id: string
}
class DeleteApartmentService {
    async execute({ apartment_id }: ApartmentRequest) {
        if (!apartment_id) {
            throw new Error('ID Inválido');
        }

        const apartmentAlreadyExists = await prismaClient.apartment.findFirst({
            where: {
                id: apartment_id
            }
        });

        if (apartmentAlreadyExists) {
            await prismaClient.apartment.delete({ where: { id: apartment_id } });
        } else {
            throw new Error('Apartamento não existe');
        }

        return { message: 'sucess' };
    }
}

export { DeleteApartmentService }