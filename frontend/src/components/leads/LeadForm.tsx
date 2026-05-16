import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { leadsApi } from '../../api/leads';
import type { Lead, CreateLeadData, LeadStatus, LeadSource } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface LeadFormProps {
  lead?: Lead;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Lost', label: 'Lost' },
];

const SOURCE_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Referral', label: 'Referral' },
];

interface FormErrors {
  name?: string;
  email?: string;
  source?: string;
}

export const LeadForm = ({ lead, onSuccess }: LeadFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!lead;

  const [form, setForm] = useState<CreateLeadData>({
    name: lead?.name ?? '',
    email: lead?.email ?? '',
    status: lead?.status ?? 'New',
    source: lead?.source ?? '' as LeadSource,
    notes: lead?.notes ?? '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim() || form.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!form.source) {
      newErrors.source = 'Please select a source';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: leadsApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast.success('Lead created successfully!');
      onSuccess();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Failed to create lead');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLeadData> }) =>
      leadsApi.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast.success('Lead updated successfully!');
      onSuccess();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Failed to update lead');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing && lead) {
      updateMutation.mutate({ id: lead._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="e.g. Rahul Sharma"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        error={errors.name}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="e.g. rahul@example.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Source"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
          options={SOURCE_OPTIONS}
          placeholder="Select source"
          error={errors.source}
        />
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Any additional notes..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          maxLength={500}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {form.notes?.length ?? 0}/500
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onSuccess} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {isEditing ? 'Update Lead' : 'Create Lead'}
        </Button>
      </div>
    </form>
  );
};
