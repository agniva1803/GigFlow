import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const getLeads: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteLead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const exportLeadsCSV: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=lead.controller.d.ts.map