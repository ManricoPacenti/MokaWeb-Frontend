import { axiosClient } from '../../../api/axiosClient';
import type { Role } from '../../auth/authTypes';

export type ManagerAccount = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  role: Role;
  enabled: boolean;
  accountType: 'MANAGER';
  employeeId: null;
};

export async function findManagerAccounts(): Promise<ManagerAccount[]> {
  const response = await axiosClient.get<ManagerAccount[]>(
    '/user-accounts/managers',
  );

  return response.data;
}

export async function updateManagerAccountEnabled(
  id: number,
  enabled: boolean,
): Promise<ManagerAccount> {
  const response = await axiosClient.patch<ManagerAccount>(
    `/user-accounts/${id}/enabled`,
    { enabled },
  );

  return response.data;
}