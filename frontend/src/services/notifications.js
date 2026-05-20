import api from './api';

export const getNotifications = () => api.get('/notifications/');
export const getUnreadCount = () => api.get('/notifications/unread-count/');
export const markAllRead = () => api.post('/notifications/mark-all-read/');
export const markAsRead = (id) => api.patch(`/notifications/${id}/`, { is_read: true });
export const deleteNotification = (id) => api.delete(`/notifications/${id}/`);