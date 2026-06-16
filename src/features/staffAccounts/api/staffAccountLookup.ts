import { axiosClient } from '../../../api/axiosClient';
import type { Role } from '../../auth/authTypes';

export type StaffAccountLookup = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  role: Role;
  enabled: boolean;
  accountType: 'STAFF';
  employeeId: number;
};

export async function findStaffAccounts(): Promise<StaffAccountLookup[]> {
  const response = await axiosClient.get<StaffAccountLookup[]>(
    '/user-accounts/staff',
  );

  return response.data;
}

export async function findStaffAccountByEmployeeId(
  employeeId: number,
): Promise<StaffAccountLookup | null> {
  try {
    const response = await axiosClient.get<StaffAccountLookup>(
      `/user-accounts/staff/by-employee/${employeeId}`,
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function updateUserAccountEnabled(
  id: number,
  enabled: boolean,
): Promise<StaffAccountLookup> {
  const response = await axiosClient.patch<StaffAccountLookup>(
    `/user-accounts/${id}/enabled`,
    { enabled },
  );

  return response.data;
}

export async function updateUserAccountProfileImage(
  id: number,
  profileImageUrl: string,
): Promise<StaffAccountLookup> {
  const response = await axiosClient.patch<StaffAccountLookup>(
    `/user-accounts/${id}/profile-image`,
    { profileImageUrl },
  );

  return response.data;
}

export async function deleteUserAccount(id: number): Promise<void> {
  await axiosClient.delete(`/user-accounts/${id}`);
}