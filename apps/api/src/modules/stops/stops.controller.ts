import { Request, Response, NextFunction } from 'express';
import { StopsService } from './stops.service';
import { ResponseFormatter } from '../../utils/api-response';
import { parseId } from '../../utils/parse-id';

export class StopsController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string | undefined;
            const result = await StopsService.findAll(page, limit, search);
            res.json(ResponseFormatter.paginated(result.stops, result.total, page, limit));
        } catch (error) { next(error); }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const stop = await StopsService.findById(parseId(req.params.id));
            res.json(ResponseFormatter.success(stop));
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const stop = await StopsService.create(req.body);
            res.status(201).json(ResponseFormatter.success(stop));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const stop = await StopsService.update(parseId(req.params.id), req.body);
            res.json(ResponseFormatter.success(stop));
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await StopsService.delete(parseId(req.params.id));
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
