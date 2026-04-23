import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Small utility function for tailwind class merging
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const FileUploader = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Simplified settings for the demo
  const practicumId = "practicum-123";
  const classroomId = "classroom-456";

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate maximum files
    if (selectedFiles.length > 75) {
      setError("You can only upload a maximum of 75 files at once.");
      return;
    }
    
    // Validate file types
    const validFiles = selectedFiles.filter(f => 
      f.name.toLowerCase().endsWith('.pdf') || 
      f.name.toLowerCase().endsWith('.docx')
    );

    if (validFiles.length !== selectedFiles.length) {
      setError("Some files were removed because they were not PDF or DOCX.");
    } else {
      setError(null);
    }
    
    // Store files with initial states
    setFiles(validFiles.map(f => ({
      file: f,
      name: f.name,
      status: 'pending', // pending, uploading, success, error
    })));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    // CRITICAL: Construct FormData specifically as requested
    const formData = new FormData();
    formData.append("practicum_id", practicumId);
    formData.append("classroom_id", classroomId);
    
    files.forEach(f => {
      formData.append("files", f.file);
    });

    try {
      // Set all files to uploading status locally
      setFiles(prev => prev.map(f => ({...f, status: 'uploading'})));

      const response = await axios.post(
        'http://localhost:8000/api/uploads/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      );

      // Map backend response statuses back to local state
      const backendResults = response.data.results;
      setFiles(prev => prev.map(f => {
        const result = backendResults.find(r => r.filename === f.name);
        return {
          ...f,
          status: result && result.status === 'UPLOADED' ? 'success' : 'error',
          errorMsg: result ? result.error : null
        };
      }));
      setResults(response.data);

    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during upload.");
      setFiles(prev => prev.map(f => ({...f, status: 'error'})));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="glass-panel p-8 text-center flex flex-col items-center justify-center border-dashed border-2 border-primary/50 relative overflow-hidden group">
        <input 
          type="file" 
          multiple 
          accept=".pdf,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Drag & Drop Practicum Reports</h3>
        <p className="text-text-muted text-sm mb-4">Accepts up to 75 PDF or DOCX files per batch.</p>
        
        <button 
          className="bg-primary hover:bg-opacity-80 text-white px-6 py-2 rounded-full font-medium transition-colors"
          disabled={uploading}
        >
          Select Files
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-4 border-b border-border-light pb-4">
            <h4 className="font-semibold text-lg">Selected Files ({files.length})</h4>
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2",
                uploading 
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] text-white"
              )}
            >
              {uploading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{uploading ? 'Uploading...' : 'Start Batch Processing'}</span>
            </button>
          </div>

          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-muted">Uploading to Server...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex flex-col p-3 bg-card-hover rounded-lg border border-border-light/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 truncate">
                    <FileText className="w-5 h-5 text-accent-secondary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{f.name}</span>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {f.status === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                    {f.status === 'error' && <AlertCircle className="w-5 h-5 text-danger" title={f.errorMsg} />}
                    {f.status === 'uploading' && <Loader className="w-5 h-5 animate-spin text-primary" />}
                    {f.status === 'pending' && <span className="text-xs text-text-muted">Pending</span>}
                  </div>
                </div>
                {f.errorMsg && (
                   <p className="text-xs text-danger mt-2 pl-8">{f.errorMsg}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
