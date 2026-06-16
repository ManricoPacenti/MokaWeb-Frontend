import type {
  DayOfWeekValue,
  EmployeeSkillName,
} from '../../employees/types/employeeTypes';

export type TemplateSlot = {
  day: DayOfWeekValue;
  startTime: string;
  endTime: string;
  requiredSkill: EmployeeSkillName;
  employeeId?: number | null;
};

export type HolidayWarning = {
  date: string;
  holidayName: string;
  dayOfWeek: DayOfWeekValue;
  affectedSlotsCount: number;
};

export type WeeklyScheduleTemplate = {
  id: number;
  name: string;
  weekStart: string;
  createdAt: string;
  updatedAt: string;
  slots: TemplateSlot[];
  holidayWarnings: HolidayWarning[];
};

export type CreateWeeklyScheduleTemplatePayload = {
  name: string;
  weekStart: string;
  slots: TemplateSlot[];
};

export type TemplateHolidayWarningPreview = {
  date: string;
  holidayName: string;
  dayOfWeek: DayOfWeekValue;
};