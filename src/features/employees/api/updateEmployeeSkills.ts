import { axiosClient } from '../../../api/axiosClient';
import type {
  EmployeeProficiency,
  EmployeeSkillName,
} from '../types/employeeTypes';

export type SkillItem = {
  skill: EmployeeSkillName;
  proficiency: EmployeeProficiency;
};

export type UpdateEmployeeSkillsPayload = {
  skills: SkillItem[];
};

export async function updateEmployeeSkills(
  employeeId: number,
  payload: UpdateEmployeeSkillsPayload,
): Promise<void> {
  await axiosClient.put(`/employees/${employeeId}/skills`, payload);
}