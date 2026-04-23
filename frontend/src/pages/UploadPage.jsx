import React, { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud, FileText, CheckCircle, AlertCircle,
  Loader, X, ChevronDown, Sparkles
} from 'lucide-react';
import { getCourses, getClasses, getPracticums, uploadFiles } from '../api/client';

export default function UploadPage() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [practicums, setPracticums] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPracticum, setSelectedPracticum] = useState('');

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    getCourses().then(res => setCourses(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      getClasses(selectedCourse).then(res => setClasses(res.data)).catch(() => {});
      getPracticums(selectedCourse).then(res => setPracticums(res.data)).catch(() => {});
    } else {
      setClasses([]);
      setPracticums([]);
    }
    setSelectedClass('');
    setSelectedPracticum('');
  }, [selectedCourse]);

  const handleFiles = useCallback((fileList) => {
    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length > 75) {
      setError("Maximum 75 files per batch.");
      return;
    }
    const validFiles = selectedFiles.filter(f =>
      f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx')
    );
    if (validFiles.length !== selectedFiles.length) {
      setError("Some files removed — only PDF and DOCX accepted.");
    } else {
      setError(null);
    }
    setFiles(validFiles.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      status: 'pending',
    })));
    setSuccessMsg(null);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("practicum_id", selectedPracticum || "demo-practicum");
    formData.append("classroom_id", selectedClass || "demo-class");
    files.forEach(f => formData.append("files", f.file));

    try {
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      const response = await uploadFiles(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(pct);
      });

      const backendResults = response.data.results;
      setFiles(prev => prev.map(f => {
        const result = backendResults.find(r => r.filename === f.name);
        return {
          ...f,
          status: result && result.status === 'UPLOADED' ? 'success' : 'error',
          errorMsg: result?.error || null,
        };
      }));

      setSuccessMsg(`Batch ${response.data.batch_id.substring(0, 8)}... created — processing ${backendResults.length} files in background.`);

    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Is the backend running?");
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-heading mb-2">
          <span className="gradient-text">Upload</span> Submissions
        </h1>
        <p className="text-text-muted">
          Select course details and upload student practicum reports for AI-assisted evaluation.
        </p>
      </div>

      {/* Course Selectors */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <ChevronDown className="w-4 h-4 text-primary" />
          Assessment Context
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Course</label>
            <select
              className="input"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Classroom</label>
            <select
              className="input"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              disabled={!selectedCourse}
            >
              <option value="">Select a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Practicum</label>
            <select
              className="input"
              value={selectedPracticum}
              onChange={e => setSelectedPracticum(e.target.value)}
              disabled={!selectedCourse}
            >
              <option value="">Select a practicum...</option>
              {practicums.map(p => (
                <option key={p.id} value={p.id}>#{p.number} — {p.title}</option>
              ))}
            </select>
          </div>
        </div>
        {courses.length === 0 && (
          <p className="text-xs text-text-muted mt-3 italic">
            No courses found. Go to Settings to create courses, classes, and practicums first — or upload will use demo IDs.
          </p>
        )}
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={e => handleFiles(e.target.files)}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          id="file-input"
        />
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
            <UploadCloud className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-text-heading mb-1">
            Drag & Drop Reports Here
          </h3>
          <p className="text-sm text-text-muted mb-4">
            or click to browse — accepts up to 75 PDF/DOCX files per batch
          </p>
          <label htmlFor="file-input" className="btn btn-primary cursor-pointer">
            <Sparkles className="w-4 h-4" /> Select Files
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20 text-success animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{successMsg}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-border-light flex items-center justify-between">
            <h3 className="font-semibold">Selected Files ({files.length})</h3>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn btn-primary"
            >
              {uploading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><UploadCloud className="w-4 h-4" /> Start Batch Processing</>
              )}
            </button>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="px-5 pt-4 pb-2">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-text-muted">Uploading to server...</span>
                <span className="font-semibold text-primary-light">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {/* File Items */}
          <div className="max-h-80 overflow-y-auto p-4 space-y-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-border-light hover:bg-white/[0.04] transition-colors"
              >
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-text-muted">{formatSize(f.size)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {f.status === 'success' && <CheckCircle className="w-4 h-4 text-success" />}
                  {f.status === 'error' && <AlertCircle className="w-4 h-4 text-danger" />}
                  {f.status === 'uploading' && <Loader className="w-4 h-4 animate-spin text-primary" />}
                  {f.status === 'pending' && <span className="badge badge-neutral text-[10px]">Pending</span>}
                  {f.status === 'pending' && (
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-danger/20 rounded transition-colors">
                      <X className="w-3.5 h-3.5 text-text-muted hover:text-danger" />
                    </button>
                  )}
                </div>
                {f.errorMsg && (
                  <p className="w-full text-xs text-danger mt-1">{f.errorMsg}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
