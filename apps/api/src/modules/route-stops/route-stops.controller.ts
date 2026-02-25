import { Request, Response, NextFunction } from 'express';
import { RouteStopsService } from './route-stops.service';
import { ResponseFormatter } from '../../utils/api-response';
import { parseId } from '../../utils/parse-id';

export class RouteStopsController {
    static async findByRouteId(req: Request, res: Response, next: NextFunction) {
        try {
            const routeId = parseId(req.params.routeId);
            const stops = await RouteStopsService.findByRouteId(routeId);
            res.json(ResponseFormatter.success(stops));
        } catch (error) { next(error); }
    }

    static async addStop(req: Request, res: Response, next: NextFunction) {
        try {
            const routeId = parseId(req.params.routeId);
            const { stopId, sequence } = req.body;
            const result = await RouteStopsService.addStop(routeId, stopId, sequence);
            res.status(201).json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async removeStop(req: Request, res: Response, next: NextFunction) {
        try {
            const routeId = parseId(req.params.routeId);
            const stopId = parseId(req.params.stopId);
            const result = await RouteStopsService.removeStop(routeId, stopId);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }

    static async reorder(req: Request, res: Response, next: NextFunction) {
        try {
            const routeId = parseId(req.params.routeId);
            const result = await RouteStopsService.reorder(routeId, req.body.items);
            res.json(ResponseFormatter.success(result));
        } catch (error) { next(error); }
    }
}
