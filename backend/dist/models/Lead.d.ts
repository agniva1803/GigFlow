import mongoose from 'mongoose';
import { ILead } from '../types';
declare const Lead: mongoose.Model<ILead, {}, {}, {}, mongoose.Document<unknown, {}, ILead, {}, {}> & ILead & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Lead;
//# sourceMappingURL=Lead.d.ts.map