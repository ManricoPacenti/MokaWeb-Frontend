import { axiosClient } from '../../../api/axiosClient';
import type {
  Employee,
  EmployeeDetails,
  EmployeeSkillName,
  UpdateEmployeeDetailsPayload,
} from '../types/employeeTypes';

export type AvailableEmployeeSearchParams = {
  skill: EmployeeSkillName;
  day: string;
  startTime: string;
  endTime: string;
};

export type AvailableEmployee = {
  id: number;
  firstName: string;
  lastName: string;
};

export async function getEmployees(): Promise<Employee[]> {
  const response = await axiosClient.get<Employee[]>('/employees');
  return response.data;
}

export async function getEmployeeById(id: number): Promise<EmployeeDetails> {
  const response = await axiosClient.get<EmployeeDetails>(`/employees/${id}`);
  return response.data;
}

export async function updateEmployeeActive(
  id: number,
  active: boolean,
): Promise<Employee> {
  const response = await axiosClient.patch<Employee>(`/employees/${id}/active`, {
    active,
  });

  return response.data;
}

export async function updateEmployeeDetails(
  id: number,
  payload: UpdateEmployeeDetailsPayload,
): Promise<Employee> {
  const response = await axiosClient.put<Employee>(
    `/employees/${id}/details`,
    payload,
  );

  return response.data;
}

export async function findAvailableEmployees(
  params: AvailableEmployeeSearchParams,
): Promise<AvailableEmployee[]> {
  const response = await axiosClient.get<AvailableEmployee[]>(
    '/employees/available',
    { params },
  );

  return response.data;
}