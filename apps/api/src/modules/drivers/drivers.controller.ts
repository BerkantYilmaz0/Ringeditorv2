import { Request, Response, NextFunction } from 'express';
import { DriversService } from './drivers.service';
import { ResponseFormatter } from '../../utils/api-response';

export class DriversController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const search = req.query.search as string | undefined;
            const includeInactive = req.query.includeInactive === 'true';
            const result = await DriversService.findAll(page, limit, search, includeInactive);
            res.json(ResponseFormatter.paginated(result.drivers, result.total, page, limit));
        } catch (error) { next(error); }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const driver = await DriversService.findById(req.params['id'] as string);
            res.json(ResponseFormatter.success(driver));
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const driver = await DriversService.create(req.body);
            res.status(201).json(ResponseFormatter.success(driver, 201));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const driver = await DriversService.update(req.params['id'] as string, req.body);
            res.json(ResponseFormatter.success(driver));
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await DriversService.delete(req.params['id'] as string);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
