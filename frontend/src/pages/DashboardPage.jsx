import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, ClipboardList, BarChart3, TrendingUp,
  FileText, Users, BookOpen, ArrowRight, Activity, Sparkles
} from 'lucide-react';
import { getBatches } from '../api/client';

export default function DashboardPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBatches()
      .then(res => setBatches(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalProcessed = batches.reduce((sum, b) => sum + b.processed_count, 0);
  const totalFailed = batches.reduce((sum, b) => sum + b.failed_count, 0);
  const completedBatches = batches.filter(b => b.status === 'COMPLETED').length;

  const stats = [
    { label: 'Total Batches', value: batches.length, icon: ClipboardList, color: 'stat-card-purple', accent: 'text-primary-light' },
    { label: 'Files Processed', value: totalProcessed, icon: FileText, color: 'stat-card-cyan', accent: 'text-accent' },
    { label: 'Completed', value: completedBatches, icon: TrendingUp, color: 'stat-card-green', accent: 'text-success' },
    { label: 'Failed', value: totalFailed, icon: Activity, color: 'stat-card-pink', accent: 'text-secondary' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-text-heading mb-2">
          Welcome back <span className="gradient-text">Faculty</span>
        </h1>
        <p className="text-text-muted text-lg">
          Here's an overview of your practicum assessment pipeline.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        {stats.map((stat, i) => (
          <div key={i} className={`glass-panel stat-card ${stat.color} p-5 animate-fade-in-up`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-muted text-sm font-medium mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5">
                <stat.icon className={`w-5 h-5 ${stat.accent}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/upload"
          className="glass-panel p-6 group cursor-pointer flex items-center gap-4 hover:border-primary/50 transition-all"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
            <Upload className="w-6 h-6 text-primary-light" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-heading group-hover:text-primary-light transition-colors">
              Upload Submissions
            </h3>
            <p className="text-sm text-text-muted">
              Batch upload PDF/DOCX practicum reports for AI assessment
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary-light group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/results"
          className="glass-panel p-6 group cursor-pointer flex items-center gap-4 hover:border-success/50 transition-all"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-accent/20 group-hover:from-success/30 group-hover:to-accent/30 transition-all">
            <BarChart3 className="w-6 h-6 text-success-light" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-heading group-hover:text-success-light transition-colors">
              View Results
            </h3>
            <p className="text-sm text-text-muted">
              Review, edit, and export AI-generated evaluation scores
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-success-light group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Batches */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold">Recent Batches</h2>
          </div>
          <Link to="/batches" className="text-sm text-primary-light hover:text-primary font-medium flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading batches...
          </div>
        ) : batches.length === 0 ? (
          <div className="empty-state">
            <ClipboardList className="empty-state-icon" />
            <p className="text-text-muted text-sm">No batches yet. Upload your first set of submissions!</p>
            <Link to="/upload" className="btn btn-primary btn-sm mt-4">
              <Upload className="w-4 h-4" /> Start Upload
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Status</th>
                <th className="text-center">Files</th>
                <th className="text-center">Processed</th>
                <th className="text-center">Failed</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {batches.slice(0, 5).map(batch => (
                <tr key={batch.id}>
                  <td className="font-mono text-xs text-primary-light">{batch.id.substring(0, 8)}...</td>
                  <td>
                    <span className={`badge ${
                      batch.status === 'COMPLETED' ? 'badge-success' :
                      batch.status === 'PROCESSING' ? 'badge-warning' :
                      batch.status === 'FAILED' ? 'badge-danger' : 'badge-neutral'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="text-center">{batch.total_files}</td>
                  <td className="text-center text-success">{batch.processed_count}</td>
                  <td className="text-center text-danger">{batch.failed_count}</td>
                  <td className="text-text-muted text-xs">{new Date(batch.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
