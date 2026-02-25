import { Request, Response, NextFunction } from 'express';
import { TemplateJobsService } from './template-jobs.service';
import { ResponseFormatter } from '../../utils/api-response';
import { parseId } from '../../utils/parse-id';

export class TemplateJobsController {
    static async findByTemplateId(req: Request, res: Response, next: NextFunction) {
        try {
            const templateId = parseId(req.params.templateId);
            const jobs = await TemplateJobsService.findByTemplateId(templateId);
            res.json(ResponseFormatter.success(jobs));
        } catch (error) { next(error); }
    }

    static async bulkCreate(req: Request, res: Response, next: NextFunction) {
        try {
            const templateId = parseId(req.params.templateId);
            const result = await TemplateJobsService.bulkCreate(templateId, req.body.items);
            res.status(201).json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseId(req.params.id);
            const result = await TemplateJobsService.update(id, req.body);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseId(req.params.id);
            const result = await TemplateJobsService.delete(id);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async bulkDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await TemplateJobsService.bulkDelete(req.body.ids);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
