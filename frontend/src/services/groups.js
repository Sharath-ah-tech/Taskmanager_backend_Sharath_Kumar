import api from './api';

export const getGroups = () => api.get('/groups/');
export const createGroup = (data) => api.post('/groups/', data);
export const getGroupDetail = (id) => api.get(`/groups/${id}/`);
export const updateGroup = (id, data) => api.patch(`/groups/${id}/`, data);
export const deleteGroup = (id) => api.delete(`/groups/${id}/`);
export const getGroupMembers = (groupId) => api.get(`/groups/${groupId}/members/`);
export const addMember = (groupId, email, role) => 
  api.post(`/groups/${groupId}/members/`, { email, role });
export const updateMemberRole = (groupId, userId, role) => 
  api.patch(`/groups/${groupId}/members/${userId}/`, { role });
export const removeMember = (groupId, userId) => 
  api.delete(`/groups/${groupId}/members/${userId}/`);