import api from './api';

export const getTasks = (params) => api.get('/tasks/', { params });
export const createTask = (data) => api.post('/tasks/', data);
export const getTaskDetail = (id) => api.get(`/tasks/${id}/`);
export const updateTask = (id, data) => api.patch(`/tasks/${id}/`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}/`);
export const getTaskComments = (taskId) => api.get(`/tasks/${taskId}/comments/`);
export const addComment = (taskId, content) => 
  api.post(`/tasks/${taskId}/comments/`, { content });
export const updateComment = (taskId, commentId, content) => 
  api.patch(`/tasks/${taskId}/comments/${commentId}/`, { content });
export const deleteComment = (taskId, commentId) => 
  api.delete(`/tasks/${taskId}/comments/${commentId}/`);
export const uploadAttachment = (taskId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/tasks/${taskId}/attachments/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteAttachment = (taskId, attachmentId) => 
  api.delete(`/tasks/${taskId}/attachments/${attachmentId}/`);