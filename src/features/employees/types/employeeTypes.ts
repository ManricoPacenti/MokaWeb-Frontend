/**
 * TypeScript contracts for the Employee feature.
 */
export type EmployeePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type EmployeeSkillName =
  | 'BAR'
  | 'KITCHEN'
  | 'RESP'
  | 'RUNNER'
  | 'WAITER'
  | 'OPENING';

export type EmployeeProficiency = 'LOW' | 'MID' | 'HIGH';

export type DayOfWeekValue =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type EmployeeSkill = {
  skill: EmployeeSkillName;
  proficiency: EmployeeProficiency;
};

export type EmployeeFullDayOff = {
  dayOfWeek: DayOfWeekValue;
};

export type EmployeeWeeklyTimeOff = {
  dayOfWeek: DayOfWeekValue;
  startTime: string;
  endTime: string;
};

export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  active: boolean;
  priority: EmployeePriority;
  agreedHours: number;
  hourlyCost: number;
  displayColor: string;
};

export type EmployeeDetails = Employee & {
  skills: EmployeeSkill[];
  fullDaysOff: EmployeeFullDayOff[];
  weeklyTimeOff: EmployeeWeeklyTimeOff[];
  createdAt: string;
  updatedAt: string;
};

export type UpdateEmployeeDetailsPayload = {
  priority: EmployeePriority;
  agreedHours: number;
  hourlyCost: number;
  displayColor: string;
};