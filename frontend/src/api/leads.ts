import api from './axios';
import type {
  ApiResponse,
  Lead,
  LeadFilters,
  LeadStats,
  CreateLeadData,
  UpdateLeadData,
  Activity,
  BulkImportRow,
  BulkImportResult,
} from '../types';

export const leadsApi = {
  getLeads: async (filters: Partial<LeadFilters>) => {
    const params: Record<string, string | number> = {};
    if (filters.page) params['page'] = filters.page;
    if (filters.limit) params['limit'] = filters.limit;
    if (filters.status) params['status'] = filters.status;
    if (filters.source) params['source'] = filters.source;
    if (filters.search) params['search'] = filters.search;
    if (filters.sort) params['sort'] = filters.sort;

    const response = await api.get<ApiResponse<Lead[]>>('/leads', { params });
    return response.data;
  },

  getLead: async (id: string) => {
    const response = await api.get<ApiResponse<Lead>>(`/leads/${id}`);
    return response.data;
  },

  getLeadActivity: async (id: string) => {
    const response = await api.get<ApiResponse<Activity[]>>(`/leads/${id}/activity`);
    return response.data;
  },

  createLead: async (data: CreateLeadData) => {
    const response = await api.post<ApiResponse<Lead>>('/leads', data);
    return response.data;
  },

  updateLead: async (id: string, data: UpdateLeadData) => {
    const response = await api.put<ApiResponse<Lead>>(`/leads/${id}`, data);
    return response.data;
  },

  deleteLead: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/leads/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<LeadStats>>('/leads/stats');
    return response.data;
  },

  bulkImport: async (rows: BulkImportRow[]) => {
    const response = await api.post<ApiResponse<BulkImportResult>>('/leads/bulk-import', { rows });
    return response.data;
  },

  exportCSV: async (filters: Partial<LeadFilters>) => {
    const params: Record<string, string | number> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.source) params['source'] = filters.source;
    if (filters.search) params['search'] = filters.search;

    const response = await api.get('/leads/export/csv', {
      params,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leads-export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
