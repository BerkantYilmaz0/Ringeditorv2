import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { ResponseFormatter } from '../../utils/api-response';

export class NotificationsController {
    static async getAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const notifications = await NotificationsService.getAll();
            res.json(ResponseFormatter.success(notifications));
        } catch (error) { next(error); }
    }
}
