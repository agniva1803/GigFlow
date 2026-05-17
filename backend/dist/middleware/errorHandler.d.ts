import { Request, Response, NextFunction } from 'express';
export declare const notFound: (req: Request, res: Response) => void;
export declare const errorHandler: (err: Error & {
    statusCode?: number;
    code?: number;
}, _req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map