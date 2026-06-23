export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost';
export type LeadSource = 'Website' | 'Instagram' | 'Referral';
export type UserRole = 'admin' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  notes?: string;
  createdBy: { _id: string; name: string; email: string } | string;
  assignedTo?: { _id: string; name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown[];
  pagination?: PaginationMeta;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LeadFilters {
  page: number;
  limit: number;
  status?: LeadStatus | '';
  source?: LeadSource | '';
  search?: string;
  sort: 'latest' | 'oldest';
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
}

export interface CreateLeadData {
  name: string;
  email: string;
  status: LeadStatus;
  source: LeadSource;
  notes?: string;
}

export type UpdateLeadData = Partial<CreateLeadData>;

export type ActivityAction = 'created' | 'status_changed' | 'assigned' | 'updated' | 'deleted' | 'note_added';

export interface Activity {
  _id: string;
  lead: string;
  actor: { _id: string; name: string; email: string; role: UserRole } | string;
  action: ActivityAction;
  field?: string;
  fromValue?: string;
  toValue?: string;
  message: string;
  createdAt: string;
}

export interface BulkImportRow {
  name: string;
  email: string;
  status?: LeadStatus;
  source: LeadSource;
  notes?: string;
}

export interface BulkImportResultError {
  row: number;
  name?: string;
  email?: string;
  error: string;
}

export interface BulkImportResult {
  createdCount: number;
  errorCount: number;
  errors: BulkImportResultError[];
}
