import { axiosClient } from '../../api/axiosClient';
import type { LoginRequest, LoginResponse, MeResponse } from './authTypes';

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await axiosClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function meApi(): Promise<MeResponse> {
  const response = await axiosClient.get<MeResponse>('/auth/me');
  return response.data;
}

export async function updateProfileImageApi(
  userId: number,
  profileImageUrl: string,
): Promise<MeResponse> {
  const response = await axiosClient.patch<MeResponse>(
    `/user-accounts/${userId}/profile-image`,
    { profileImageUrl },
  );

  return response.data;
}

export async function uploadProfileImageApi(
  userId: number,
  file: File,
): Promise<MeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post<MeResponse>(
    `/user-accounts/${userId}/profile-image/upload`,
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    },
  );

  return response.data;
}