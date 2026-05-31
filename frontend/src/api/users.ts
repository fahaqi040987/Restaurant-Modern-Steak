// File: frontend/src/api/users.ts
import { api } from './client';

export interface ApproveUserParams {
  userId: string;
  role: string;
}

export const approveUser = async (userId: string, role: string) => {
  const response = await api.post(`/users/${userId}/approve`, { role });
  return response.data;
};

export const rejectUser = async (userId: string) => {
  const response = await api.post(`/users/${userId}/reject`);
  return response.data;
};

export const unlinkGoogleAccount = async () => {
  const response = await api.delete('/auth/unlink-google');
  return response.data;
};
