import { Request, Response, NextFunction } from 'express';
import { TemplatesService } from './templates.service';
import { ResponseFormatter } from '../../utils/api-response';
import { parseId } from '../../utils/parse-id';

export class TemplatesController {
    static async findAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const templates = await TemplatesService.findAll();
            res.json(ResponseFormatter.success(templates));
        } catch (error) { next(error); }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const template = await TemplatesService.findById(parseId(req.params.id));
            res.json(ResponseFormatter.success(template));
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const template = await TemplatesService.create(req.body);
            res.status(201).json(ResponseFormatter.success(template));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const template = await TemplatesService.update(parseId(req.params.id), req.body);
            res.json(ResponseFormatter.success(template));
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await TemplatesService.delete(parseId(req.params.id));
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
