import { axiosClient } from '../../../api/axiosClient';
import type { DayOfWeekValue } from '../types/employeeTypes';

export type WeeklyTimeOffItem = {
  dayOfWeek: DayOfWeekValue;
  startTime: string;
  endTime: string;
};

export type UpdateEmployeeAvailabilityPayload = {
  fullDaysOff: DayOfWeekValue[];
  weeklyTimeOff: WeeklyTimeOffItem[];
};

export async function updateEmployeeAvailability(
  employeeId: number,
  payload: UpdateEmployeeAvailabilityPayload,
): Promise<void> {
  await axiosClient.put(`/employees/${employeeId}/weekly-availability`, payload);
}