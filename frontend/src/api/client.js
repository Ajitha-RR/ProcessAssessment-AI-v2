import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
  }
});

// --- Courses ---
export const getCourses = () => api.get('/courses/');
export const createCourse = (data) => api.post('/courses/', null, { params: data });
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

// --- Classes ---
export const getClasses = (courseId) => api.get('/classes/', { params: { course_id: courseId } });
export const createClass = (data) => api.post('/classes/', null, { params: data });
export const deleteClass = (id) => api.delete(`/classes/${id}`);

// --- Practicums ---
export const getPracticums = (courseId) => api.get('/practicums/', { params: { course_id: courseId } });
export const createPracticum = (data) => api.post('/practicums/', null, { params: data });
export const deletePracticum = (id) => api.delete(`/practicums/${id}`);

// --- Uploads ---
export const uploadFiles = (formData, onProgress) =>
  api.post('/uploads/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });

// --- Results ---
export const getResults = (params) => api.get('/results/', { params });
export const getBatches = () => api.get('/results/batches');
export const getBatch = (id) => api.get(`/results/batches/${id}`);

// --- Exports ---
export const exportCSV = (batchId) =>
  api.get('/exports/csv', { params: { batch_id: batchId }, responseType: 'blob' });
export const exportXLSX = (batchId) =>
  api.get('/exports/xlsx', { params: { batch_id: batchId }, responseType: 'blob' });

export default api;
