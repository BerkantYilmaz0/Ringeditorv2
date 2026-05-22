import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { ResponseFormatter } from '../../utils/api-response';

export class ReportsController {
    static async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = 'month', from, to } = req.query as Record<string, string>;
            const data = await ReportsService.getSummary(period, from, to);
            res.json(ResponseFormatter.success(data));
        } catch (error) { next(error); }
    }

    static async getTimeline(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = 'month', from, to } = req.query as Record<string, string>;
            const data = await ReportsService.getTimeline(period, from, to);
            res.json(ResponseFormatter.success(data));
        } catch (error) { next(error); }
    }

    static async getVehicleStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = 'month', from, to } = req.query as Record<string, string>;
            const data = await ReportsService.getVehicleStats(period, from, to);
            res.json(ResponseFormatter.success(data));
        } catch (error) { next(error); }
    }

    static async getRouteStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = 'month', from, to } = req.query as Record<string, string>;
            const data = await ReportsService.getRouteStats(period, from, to);
            res.json(ResponseFormatter.success(data));
        } catch (error) { next(error); }
    }

    static async getDriverStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { period = 'month', from, to } = req.query as Record<string, string>;
            const data = await ReportsService.getDriverStats(period, from, to);
            res.json(ResponseFormatter.success(data));
        } catch (error) { next(error); }
    }
}
