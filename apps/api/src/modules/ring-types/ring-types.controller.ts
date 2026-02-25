import { Request, Response, NextFunction } from 'express';
import { RingTypesService } from './ring-types.service';
import { ResponseFormatter } from '../../utils/api-response';
import { parseId } from '../../utils/parse-id';

export class RingTypesController {
    static async findAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const ringTypes = await RingTypesService.findAll();
            res.json(ResponseFormatter.success(ringTypes));
        } catch (error) { next(error); }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const ringType = await RingTypesService.findById(parseId(req.params.id));
            res.json(ResponseFormatter.success(ringType));
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const ringType = await RingTypesService.create(req.body);
            res.status(201).json(ResponseFormatter.success(ringType));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const ringType = await RingTypesService.update(parseId(req.params.id), req.body);
            res.json(ResponseFormatter.success(ringType));
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await RingTypesService.delete(parseId(req.params.id));
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
