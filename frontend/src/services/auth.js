import api from './api';

export const register = (userData) => api.post('/auth/register/', userData);
export const login = (credentials) => api.post('/auth/login/', credentials);
export const logout = (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken });
export const getProfile = () => api.get('/auth/me/');
export const updateProfile = (data) => api.patch('/auth/me/', data);
export const changePassword = (data) => api.post('/auth/me/password/', data);
export const requestPasswordReset = (email) => api.post('/auth/password-reset/', { email });
export const resetPassword = (uid, token, newPassword) => 
  api.post(`/auth/password-reset/confirm/${uid}/${token}/`, { new_password: newPassword });