import { Request, Response, NextFunction } from 'express';
import { JobsService } from './jobs.service';
import { ResponseFormatter } from '../../utils/api-response';
import { parseId } from '../../utils/parse-id';
import { ApiError } from '../../utils/api-error';

export class JobsController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const filters = {
                vehicleId: req.query.vehicleId as string | undefined,
                routeId: req.query.routeId ? parseInt(req.query.routeId as string) : undefined,
                date: req.query.date as string | undefined,
            };
            const result = await JobsService.findAll(page, limit, filters);
            res.json(ResponseFormatter.paginated(result.jobs, result.total, page, limit));
        } catch (error) { next(error); }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const job = await JobsService.findById(parseId(req.params.id));
            res.json(ResponseFormatter.success(job));
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const job = await JobsService.create(req.body);
            res.status(201).json(ResponseFormatter.success(job));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const job = await JobsService.update(parseId(req.params.id), req.body);
            res.json(ResponseFormatter.success(job));
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await JobsService.delete(parseId(req.params.id));
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async bulkDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await JobsService.bulkDelete(req.body.ids);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async checkConflicts(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await JobsService.checkConflicts(req.body.items);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async generateFromTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await JobsService.generateFromTemplate(req.body);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async getCalendarStats(req: Request, res: Response, next: NextFunction) {
        try {
            const month = req.query.month as string;
            if (!month) throw ApiError.badRequest('month query parametresi gerekli');
            const result = await JobsService.getCalendarStats(month);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
