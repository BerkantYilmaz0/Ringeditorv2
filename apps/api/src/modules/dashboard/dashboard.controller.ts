import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { ResponseFormatter } from '../../utils/api-response';

export class DashboardController {
    static async getStats(_req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await DashboardService.getStats();
            res.json(ResponseFormatter.success(stats));
        } catch (error) { next(error); }
    }
}
