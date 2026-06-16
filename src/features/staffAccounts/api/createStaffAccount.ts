import { axiosClient } from '../../../api/axiosClient';

export type CreateStaffAccountPayload = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  rawPassword: string;
  employeeId: number;
};

export async function createStaffAccount(
  payload: CreateStaffAccountPayload,
): Promise<void> {
  await axiosClient.post('/user-accounts/staff', payload);
}