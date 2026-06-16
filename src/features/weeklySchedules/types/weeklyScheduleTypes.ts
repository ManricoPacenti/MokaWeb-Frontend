import type {
  DayOfWeekValue,
  EmployeeSkillName,
} from '../../employees/types/employeeTypes';

export type WeeklyScheduleAssignment = {
  day: DayOfWeekValue;
  startTime: string;
  endTime: string;
  requiredSkill: EmployeeSkillName;
  employeeId: number | null;
  employeeFirstName: string | null;
  employeeLastName: string | null;
  employeeDisplayColor: string | null;
  assigned: boolean;
};

export type WeeklySchedule = {
  id: number;
  templateId: number;
  weekStart: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  assignments: WeeklyScheduleAssignment[];
};

export type GenerateWeeklySchedulePayload = {
  templateId: number;
};