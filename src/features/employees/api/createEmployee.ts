import { axiosClient } from '../../../api/axiosClient';
import type { EmployeePriority } from '../types/employeeTypes';

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  active: boolean;
  priority: EmployeePriority;
  agreedHours: number;
  hourlyCost: number;
  displayColor: string;
};

export async function createEmployee(
  payload: CreateEmployeePayload,
): Promise<void> {
  await axiosClient.post('/employees', payload);
}