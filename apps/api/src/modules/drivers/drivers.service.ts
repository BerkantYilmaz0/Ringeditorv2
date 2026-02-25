import { prisma } from '../../config/database';

export class DriversService {
    static async findAll() {
        // Araç formu için sadece aktif şoförleri listeleyelim
        const drivers = await prisma.driver.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, phone: true }
        });

        return drivers;
    }
}
