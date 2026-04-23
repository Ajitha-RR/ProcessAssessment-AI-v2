import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, RefreshCw, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getBatches } from '../api/client';

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = () => {
    setLoading(true);
    getBatches().then(res => setBatches(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBatches(); }, []);

  const statusBadge = (s) => {
    const m = { COMPLETED: 'badge-success', PROCESSING: 'badge-warning', FAILED: 'badge-danger' };
    return m[s] || 'badge-neutral';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-heading mb-2"><span className="gradient-text">Batch</span> History</h1>
          <p className="text-text-muted">Track uploaded assessment batches.</p>
        </div>
        <button onClick={fetchBatches} className="btn btn-secondary"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div></div>
      ) : batches.length === 0 ? (
        <div className="glass-panel empty-state"><ClipboardList className="empty-state-icon" /><p className="text-text-muted text-sm mb-4">No batches yet.</p><Link to="/upload" className="btn btn-primary btn-sm">Go to Upload</Link></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map(batch => {
            const pct = batch.total_files > 0 ? Math.round(((batch.processed_count + batch.failed_count) / batch.total_files) * 100) : 0;
            return (
              <div key={batch.id} className="glass-panel p-5 animate-fade-in-up">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm font-semibold text-primary-light font-mono">{batch.id.substring(0, 12)}...</p>
                  <span className={`badge ${statusBadge(batch.status)}`}>{batch.status}</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-text-muted">Progress</span><span>{pct}%</span></div>
                  <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${pct}%` }}></div></div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
                  <div className="p-2 rounded-lg bg-white/[0.03]"><p className="text-text-muted text-[10px]">Total</p><p className="font-bold">{batch.total_files}</p></div>
                  <div className="p-2 rounded-lg bg-white/[0.03]"><p className="text-text-muted text-[10px]">Done</p><p className="font-bold text-success">{batch.processed_count}</p></div>
                  <div className="p-2 rounded-lg bg-white/[0.03]"><p className="text-text-muted text-[10px]">Failed</p><p className="font-bold text-danger">{batch.failed_count}</p></div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border-light">
                  <span>{new Date(batch.created_at).toLocaleDateString()}</span>
                  <Link to={`/results?batch_id=${batch.id}`} className="text-primary-light hover:text-primary font-medium flex items-center gap-1"><Eye className="w-3 h-3" /> Results</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
