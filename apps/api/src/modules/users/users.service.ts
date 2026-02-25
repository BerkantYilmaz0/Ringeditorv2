import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { UserCreateInput, UserUpdateInput } from '@ring-planner/shared';
import bcrypt from 'bcryptjs';

export class UsersService {
    // tüm kullanıcıları sayfalı getir
    static async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count(),
        ]);

        return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // id'ye göre tek kullanıcı getir
    static async findById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw ApiError.notFound('Kullanıcı bulunamadı');
        }

        return user;
    }

    // yeni kullanıcı oluştur
    static async create(data: UserCreateInput) {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username: data.username }, { email: data.email || undefined }],
            },
        });

        if (existingUser) {
            throw ApiError.conflict('Bu kullanıcı adı veya e-posta zaten kullanımda');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);

        const newUser = await prisma.user.create({
            data: {
                username: data.username,
                passwordHash,
                fullName: data.fullName,
                email: data.email || null,
                phone: data.phone || null,
                role: data.role || 'VIEWER',
                isActive: data.isActive ?? true,
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                isActive: true,
            },
        });

        return newUser;
    }

    // kullanıcı güncelle
    static async update(id: string, data: UserUpdateInput) {
        await this.findById(id);

        // prisma update için hazırla
        const updatePayload: Record<string, unknown> = {};
        if (data.username !== undefined) updatePayload.username = data.username;
        if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
        if (data.email !== undefined) updatePayload.email = data.email;
        if (data.phone !== undefined) updatePayload.phone = data.phone;
        if (data.role !== undefined) updatePayload.role = data.role;
        if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

        if (data.password) {
            const salt = await bcrypt.genSalt(10);
            updatePayload.passwordHash = await bcrypt.hash(data.password, salt);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updatePayload,
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                isActive: true,
            },
        });

        return updatedUser;
    }

    // kullanıcı sil
    static async delete(id: string) {
        await this.findById(id);
        await prisma.user.delete({ where: { id } });
        return { success: true };
    }
}
