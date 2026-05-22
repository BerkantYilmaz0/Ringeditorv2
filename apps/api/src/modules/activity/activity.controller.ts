import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service';
import { ResponseFormatter } from '../../utils/api-response';

export class ActivityController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const { userId, entity, from, to } = req.query as Record<string, string>;
            const result = await ActivityService.findAll(page, limit, userId, entity, from, to);
            res.json(ResponseFormatter.paginated(result.logs, result.total, page, limit));
        } catch (error) { next(error); }
    }
}
