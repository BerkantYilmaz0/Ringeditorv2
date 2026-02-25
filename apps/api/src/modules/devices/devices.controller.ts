import { Request, Response, NextFunction } from 'express';
import { DevicesService } from './devices.service';
import { ResponseFormatter } from '../../utils/api-response';

export class DevicesController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string | undefined;

            const result = await DevicesService.findAll(page, limit, search);
            res.json(ResponseFormatter.paginated(result.vehicles, result.total, page, limit));
        } catch (error) {
            next(error);
        }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const device = await DevicesService.findById(id);
            res.json(ResponseFormatter.success(device));
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const newDevice = await DevicesService.create(req.body);
            res.status(201).json(ResponseFormatter.success(newDevice));
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const updatedDevice = await DevicesService.update(id, req.body);
            res.json(ResponseFormatter.success(updatedDevice));
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const result = await DevicesService.delete(id);
            res.json(ResponseFormatter.success(result));
        } catch (error) {
            next(error);
        }
    }
}
