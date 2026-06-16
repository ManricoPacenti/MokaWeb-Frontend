import { axiosClient } from '../../../api/axiosClient';

export type CreateManagerAccountPayload = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  rawPassword: string;
};

export async function createManagerAccount(
  payload: CreateManagerAccountPayload,
): Promise<void> {
  await axiosClient.post('/user-accounts/managers', payload);
}