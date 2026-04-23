import React, { useState, useEffect } from 'react';
import { Download, Search, Edit2, Save, X, Check } from 'lucide-react';
import axios from 'axios';

const ResultsTable = () => {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Mock data for UI demonstration until backend integration is fully tested
  useEffect(() => {
    setResults([
      { id: "1", name: "Alice Smith", reg: "21BCE1001", process: 16, product: 10, total: 26, remarks: "Good interpretation.", status: "Draft" },
      { id: "2", name: "Bob Jones", reg: "21BCE1002", process: 15, product: 11, total: 26, remarks: "Excellent tables.", status: "Reviewed" },
      { id: "3", name: "Charlie Day", reg: "21BCE1003", process: 12, product: 8, total: 20, remarks: "Missing conclusion details.", status: "Finalized" },
    ]);
  }, []);

  const handleEditClick = (record) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const handleSave = () => {
    setResults(results.map(r => r.id === editingId ? { ...editForm, total: Number(editForm.process) + Number(editForm.product), status: 'Reviewed' } : r));
    setEditingId(null);
  };

  const filteredResults = results.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.reg.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 mt-12 bg-dark min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Batch Results</h2>
          <p className="text-text-muted mt-1">Review, edit, and export AI evaluations for Practicum 1.</p>
        </div>
        <button className="bg-success text-white px-5 py-2 rounded-lg font-medium shadow-lg hover:shadow-success/30 flex items-center space-x-2 transition-all">
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border-light flex items-center space-x-4 bg-card-hover/50">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or register number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark/50 border border-border-light rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark/80 text-text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Reg No</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium text-center">Process (18)</th>
                <th className="p-4 font-medium text-center">Product (12)</th>
                <th className="p-4 font-medium text-center">Total (30)</th>
                <th className="p-4 font-medium">Remarks</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredResults.map(record => (
                <tr key={record.id} className="hover:bg-card-hover/30 transition-colors">
                  <td className="p-4 text-sm font-medium">{record.reg}</td>
                  <td className="p-4 text-sm">{record.name}</td>
                  
                  {/* Process Marks */}
                  <td className="p-4 text-sm text-center">
                    {editingId === record.id ? (
                      <input type="number" max="18" min="0" value={editForm.process} onChange={e => setEditForm({...editForm, process: e.target.value})} className="w-16 bg-dark border border-primary rounded p-1 text-center" />
                    ) : record.process}
                  </td>

                  {/* Product Marks */}
                  <td className="p-4 text-sm text-center">
                    {editingId === record.id ? (
                      <input type="number" max="12" min="0" value={editForm.product} onChange={e => setEditForm({...editForm, product: e.target.value})} className="w-16 bg-dark border border-primary rounded p-1 text-center" />
                    ) : record.product}
                  </td>

                  <td className="p-4 text-sm text-center font-bold text-primary">{record.total}</td>
                  
                  {/* Remarks */}
                  <td className="p-4 text-sm max-w-xs truncate" title={record.remarks}>
                    {editingId === record.id ? (
                      <input type="text" value={editForm.remarks} onChange={e => setEditForm({...editForm, remarks: e.target.value})} className="w-full bg-dark border border-primary rounded p-1" />
                    ) : record.remarks}
                  </td>

                  {/* Status */}
                  <td className="p-4 text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      record.status === 'Finalized' ? 'bg-success/20 text-success border border-success/30' :
                      record.status === 'Reviewed' ? 'bg-primary/20 text-primary border border-primary/30' :
                      'bg-warning/20 text-warning border border-warning/30'
                    }`}>
                      {record.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-sm text-right">
                    {editingId === record.id ? (
                      <div className="flex justify-end space-x-2">
                        <button onClick={handleSave} className="p-1.5 bg-success/20 text-success rounded hover:bg-success hover:text-white transition-colors" title="Save"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-danger/20 text-danger rounded hover:bg-danger hover:text-white transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditClick(record)} disabled={record.status === 'Finalized'} className="p-1.5 text-text-muted hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredResults.length === 0 && (
             <div className="p-8 text-center text-text-muted">No records found matching your search.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
