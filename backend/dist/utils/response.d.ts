import { Response } from 'express';
import { PaginationMeta } from '../types';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, pagination?: PaginationMeta) => void;
export declare const sendError: (res: Response, message: string, statusCode?: number, errors?: unknown[]) => void;
//# sourceMappingURL=response.d.ts.map