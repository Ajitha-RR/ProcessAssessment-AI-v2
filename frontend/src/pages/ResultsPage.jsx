import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Edit2, Save, X, Check, BarChart3, FileText } from 'lucide-react';
import { getResults, exportCSV, exportXLSX } from '../api/client';

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batch_id');
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setLoading(true);
    getResults({ batch_id: batchId, search: search || undefined })
      .then(res => { setResults(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  const filtered = results.filter(r =>
    (r.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.register_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (r) => { setEditingId(r.id); setEditForm({ process: r.evaluation?.total_process || 0, product: r.evaluation?.total_product || 0, remarks: r.evaluation?.remarks || '' }); };
  const handleSave = () => {
    setEditingId(null);
  };

  const handleExport = async (type) => {
    try {
      const fn = type === 'csv' ? exportCSV : exportXLSX;
      const res = await fn(batchId);
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `results.${type}`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Export failed — is the backend running?'); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-heading mb-1"><span className="gradient-text">Results</span></h1>
          <p className="text-text-muted text-sm">{batchId ? `Batch: ${batchId.substring(0, 12)}...` : 'All evaluated submissions'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="btn btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> CSV</button>
          <button onClick={() => handleExport('xlsx')} className="btn btn-success btn-sm"><Download className="w-3.5 h-3.5" /> Excel</button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border-light flex items-center gap-4 bg-white/[0.02]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input type="text" placeholder="Search name or register number..." value={search} onChange={e => setSearch(e.target.value)} className="input input-sm pl-9" />
          </div>
          <span className="text-xs text-text-muted">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state py-12"><FileText className="empty-state-icon" /><p className="text-text-muted text-sm">No results found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg No</th><th>Name</th><th className="text-center">Process (18)</th><th className="text-center">Product (12)</th><th className="text-center">Total (30)</th><th>Remarks</th><th className="text-center">Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-medium">{r.register_number || 'N/A'}</td>
                    <td className="text-sm">{r.student_name || 'Unknown'}</td>
                    <td className="text-center">
                      {editingId === r.id ? <input type="number" max="18" min="0" value={editForm.process} onChange={e => setEditForm({...editForm, process: +e.target.value})} className="input input-sm w-16 text-center" /> : (r.evaluation?.total_process ?? '—')}
                    </td>
                    <td className="text-center">
                      {editingId === r.id ? <input type="number" max="12" min="0" value={editForm.product} onChange={e => setEditForm({...editForm, product: +e.target.value})} className="input input-sm w-16 text-center" /> : (r.evaluation?.total_product ?? '—')}
                    </td>
                    <td className="text-center font-bold text-primary-light">{r.evaluation?.total_score ?? '—'}</td>
                    <td className="text-sm max-w-[200px] truncate" title={r.evaluation?.remarks}>
                      {editingId === r.id ? <input type="text" value={editForm.remarks} onChange={e => setEditForm({...editForm, remarks: e.target.value})} className="input input-sm" /> : (r.evaluation?.remarks || r.error_message || '—')}
                    </td>
                    <td className="text-center"><span className={`badge ${r.file_status === 'SCORED' ? 'badge-success' : r.file_status === 'FAILED' ? 'badge-danger' : 'badge-neutral'}`}>{r.file_status}</span></td>
                    <td className="text-right">
                      {editingId === r.id ? (
                        <div className="flex justify-end gap-1">
                          <button onClick={handleSave} className="btn btn-sm btn-success p-1.5"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm btn-danger p-1.5"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(r)} disabled={r.file_status === 'FAILED'} className="btn btn-ghost btn-sm p-1.5 disabled:opacity-30"><Edit2 className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
