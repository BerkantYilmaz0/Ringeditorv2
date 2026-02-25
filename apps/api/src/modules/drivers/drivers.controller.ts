import { Request, Response, NextFunction } from 'express';
import { DriversService } from './drivers.service';
import { ResponseFormatter } from '../../utils/api-response';

export class DriversController {
    static async findAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const drivers = await DriversService.findAll();
            res.json(ResponseFormatter.success(drivers));
        } catch (error) {
            next(error);
        }
    }
}
