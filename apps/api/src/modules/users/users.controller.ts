import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { ResponseFormatter } from '../../utils/api-response';

export class UsersController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await UsersService.findAll(page, limit);
            res.json(ResponseFormatter.paginated(result.users, result.total, page, limit));
        } catch (error) {
            next(error);
        }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const user = await UsersService.findById(id);
            res.json(ResponseFormatter.success(user));
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const newUser = await UsersService.create(req.body);
            res.status(201).json(ResponseFormatter.success(newUser));
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const updatedUser = await UsersService.update(id, req.body);
            res.json(ResponseFormatter.success(updatedUser));
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const result = await UsersService.delete(id);
            res.json(ResponseFormatter.success(result));
        } catch (error) {
            next(error);
        }
    }
}
