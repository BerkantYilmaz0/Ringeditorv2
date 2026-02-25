import { Request, Response, NextFunction } from 'express';
import { RoutesService } from './routes.service';
import { ResponseFormatter } from '../../utils/api-response';
import { parseId } from '../../utils/parse-id';

export class RoutesController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await RoutesService.findAll(page, limit);
            res.json(ResponseFormatter.paginated(result.routes, result.total, page, limit));
        } catch (error) { next(error); }
    }

    static async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const route = await RoutesService.findById(parseId(req.params.id));
            res.json(ResponseFormatter.success(route));
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const route = await RoutesService.create(req.body);
            res.status(201).json(ResponseFormatter.success(route));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const route = await RoutesService.update(parseId(req.params.id), req.body);
            res.json(ResponseFormatter.success(route));
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await RoutesService.delete(parseId(req.params.id));
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async getOsrmRoute(req: Request, res: Response, next: NextFunction) {
        try {
            const { coordinates } = req.query;
            if (!coordinates || typeof coordinates !== 'string') {
                throw new Error('Coordinates query parameter is required');
            }

            const osrmUrl = process.env.OSRM_URL || 'https://router.project-osrm.org';
            const response = await fetch(`${osrmUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
            const data = await response.json();

            res.json(ResponseFormatter.success(data));
        } catch (error) { next(error); }
    }
}
