import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { leadsApi } from '../../api/leads';
import type { BulkImportRow, BulkImportResult } from '../../types';
import { Button } from '../ui/Button';

interface BulkImportModalProps {
  onSuccess: () => void;
}

const SAMPLE_CSV = 'name,email,source,status,notes\nPriya Sharma,priya@example.com,Website,New,Interested in premium plan\n';

export const BulkImportModal = ({ onSuccess }: BulkImportModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<BulkImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: leadsApi.bulkImport,
    onSuccess: (res) => {
      if (res.data) {
        setResult(res.data);
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
        if (res.data.createdCount > 0) {
          toast.success(`Imported ${res.data.createdCount} lead${res.data.createdCount !== 1 ? 's' : ''}`);
        }
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Import failed');
    },
  });

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message);
          setParsedRows([]);
          return;
        }

        const rows: BulkImportRow[] = results.data
          .filter((row) => row.name || row.email)
          .map((row) => ({
            name: row.name?.trim() ?? '',
            email: row.email?.trim() ?? '',
            source: (row.source?.trim() ?? '') as BulkImportRow['source'],
            status: row.status?.trim() ? (row.status.trim() as BulkImportRow['status']) : undefined,
            notes: row.notes?.trim() || undefined,
          }));

        if (rows.length === 0) {
          setParseError('No rows found. Make sure the CSV has a header row with name, email, source columns.');
        }

        setParsedRows(rows);
      },
      error: (err) => setParseError(err.message),
    });
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    importMutation.mutate(parsedRows);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'gigflow-leads-sample.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Result screen — shown after a successful import attempt
  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            {result.createdCount} of {result.createdCount + result.errorCount} rows imported successfully
          </p>
        </div>

        {result.errorCount > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {result.errorCount} row{result.errorCount !== 1 ? 's' : ''} skipped
            </p>
            {result.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: 'var(--text-primary)' }}>
                    Row {err.row}{err.name ? ` (${err.name})` : ''}
                  </p>
                  <p style={{ color: 'var(--text-muted)' }}>{err.error}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onSuccess} className="w-full">
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Upload a CSV with columns: <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>name</code>,{' '}
          <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>email</code>,{' '}
          <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>source</code>. Status and notes are optional.
        </p>
      </div>

      <button
        onClick={downloadSample}
        className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
      >
        <Download className="w-3.5 h-3.5" />
        Download sample CSV
      </button>

      <label
        className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-brand-400"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        {fileName ? (
          <>
            <FileText className="w-8 h-8 text-brand-500" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{fileName}</p>
            {!parseError && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} ready</p>
            )}
          </>
        ) : (
          <>
            <Upload className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Click to choose a CSV file</p>
          </>
        )}
      </label>

      {parseError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {parseError}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onSuccess} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          isLoading={importMutation.isPending}
          disabled={parsedRows.length === 0 || !!parseError}
          className="flex-1"
        >
          Import {parsedRows.length > 0 ? `${parsedRows.length} lead${parsedRows.length !== 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
};
