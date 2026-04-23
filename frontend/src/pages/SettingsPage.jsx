import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Users, ClipboardList, Loader, Sparkles, CheckCircle } from 'lucide-react';
import { getCourses, createCourse, deleteCourse, getClasses, createClass, deleteClass, getPracticums, createPracticum, deletePracticum, seedPracticums } from '../api/client';

export default function SettingsPage() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [practicums, setPracticums] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Forms
  const [courseForm, setCourseForm] = useState({ name: '', code: '' });
  const [classForm, setClassForm] = useState({ name: '', section: '', student_strength: 60 });
  const [practicumForm, setPracticumForm] = useState({ number: 1, title: '' });

  useEffect(() => {
    getCourses().then(r => setCourses(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      getClasses(selectedCourse).then(r => setClasses(r.data)).catch(() => {});
      getPracticums(selectedCourse).then(r => setPracticums(r.data)).catch(() => {});
    }
  }, [selectedCourse]);

  const handleAddCourse = async () => {
    if (!courseForm.name || !courseForm.code) return;
    setLoading(true);
    try {
      await createCourse(courseForm);
      const r = await getCourses(); setCourses(r.data);
      setCourseForm({ name: '', code: '' });
    } catch { } finally { setLoading(false); }
  };

  const handleDeleteCourse = async (id) => {
    await deleteCourse(id);
    const r = await getCourses(); setCourses(r.data);
    if (selectedCourse === id) { setSelectedCourse(''); setClasses([]); setPracticums([]); }
  };

  const handleAddClass = async () => {
    if (!classForm.name || !selectedCourse) return;
    setLoading(true);
    try {
      await createClass({ ...classForm, course_id: selectedCourse });
      const r = await getClasses(selectedCourse); setClasses(r.data);
      setClassForm({ name: '', section: '', student_strength: 60 });
    } catch { } finally { setLoading(false); }
  };

  const handleDeleteClass = async (id) => {
    await deleteClass(id);
    const r = await getClasses(selectedCourse); setClasses(r.data);
  };

  const handleAddPracticum = async () => {
    if (!practicumForm.title || !selectedCourse) return;
    setLoading(true);
    try {
      await createPracticum({ ...practicumForm, course_id: selectedCourse });
      const r = await getPracticums(selectedCourse); setPracticums(r.data);
      setPracticumForm({ number: practicums.length + 2, title: '' });
    } catch { } finally { setLoading(false); }
  };

  const handleSeedPracticums = async () => {
    if (!selectedCourse) return;
    setSeeding(true);
    try {
      const r = await seedPracticums(selectedCourse);
      setPracticums(r.data);
    } catch { } finally { setSeeding(false); }
  };

  const handleDeletePracticum = async (id) => {
    await deletePracticum(id);
    const r = await getPracticums(selectedCourse); setPracticums(r.data);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-text-heading mb-2"><span className="gradient-text">Settings</span></h1>
        <p className="text-text-muted">Manage courses, classrooms, and practicums.</p>
      </div>

      {/* Courses */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary" /> Courses</h2>
        <div className="flex gap-3 mb-4 flex-wrap">
          <input className="input flex-1 min-w-[160px]" placeholder="Course Name" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} />
          <input className="input w-32" placeholder="Code" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} />
          <button onClick={handleAddCourse} disabled={loading} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="space-y-2">
          {courses.map(c => (
            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${selectedCourse === c.id ? 'border-primary/50 bg-primary/5' : 'border-border-light hover:bg-white/[0.02]'}`} onClick={() => setSelectedCourse(c.id)}>
              <div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-text-muted">{c.code}</p></div>
              <button onClick={e => { e.stopPropagation(); handleDeleteCourse(c.id); }} className="btn btn-ghost btn-sm p-1.5 text-danger hover:bg-danger/10"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          {courses.length === 0 && <p className="text-sm text-text-muted italic">No courses yet. Add one above.</p>}
        </div>
      </div>

      {selectedCourse && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classes */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-accent" /> Classrooms</h2>
            <div className="flex gap-2 mb-4 flex-wrap">
              <input className="input flex-1 min-w-[120px]" placeholder="Class Name" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              <input className="input w-24" placeholder="Section" value={classForm.section} onChange={e => setClassForm({...classForm, section: e.target.value})} />
              <input className="input w-20" type="number" placeholder="Strength" value={classForm.student_strength} onChange={e => setClassForm({...classForm, student_strength: +e.target.value})} />
              <button onClick={handleAddClass} disabled={loading} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {classes.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border-light hover:bg-white/[0.02]">
                  <div><p className="font-medium text-sm">{c.name} {c.section && <span className="text-text-muted">({c.section})</span>}</p><p className="text-xs text-text-muted">{c.student_strength} students</p></div>
                  <button onClick={() => handleDeleteClass(c.id)} className="btn btn-ghost btn-sm p-1.5 text-danger hover:bg-danger/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {classes.length === 0 && <p className="text-sm text-text-muted italic">No classes.</p>}
            </div>
          </div>

          {/* Practicums */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-secondary" /> Practicums</h2>
              {practicums.length < 30 && (
                <button
                  onClick={handleSeedPracticums}
                  disabled={seeding}
                  className="btn btn-secondary btn-sm"
                >
                  {seeding ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate All 30</>
                  )}
                </button>
              )}
              {practicums.length === 30 && (
                <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> All 30 created
                </span>
              )}
            </div>

            {/* Manual add form */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <input className="input w-16" type="number" placeholder="#" value={practicumForm.number} onChange={e => setPracticumForm({...practicumForm, number: +e.target.value})} />
              <input className="input flex-1 min-w-[120px]" placeholder="Practicum Title" value={practicumForm.title} onChange={e => setPracticumForm({...practicumForm, title: e.target.value})} />
              <button onClick={handleAddPracticum} disabled={loading} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /></button>
            </div>

            {/* Practicum list — scrollable */}
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {practicums.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border-light hover:bg-white/[0.02] group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">
                      {p.number}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="text-xs text-text-muted">Process: {p.max_process_marks} | Product: {p.max_product_marks} | Total: {p.max_process_marks + p.max_product_marks}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeletePracticum(p.id)} className="btn btn-ghost btn-sm p-1.5 text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {practicums.length === 0 && (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                  <p className="text-sm text-text-muted italic mb-3">No practicums yet.</p>
                  <button
                    onClick={handleSeedPracticums}
                    disabled={seeding}
                    className="btn btn-primary"
                  >
                    {seeding ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate All 30 Practicums</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
