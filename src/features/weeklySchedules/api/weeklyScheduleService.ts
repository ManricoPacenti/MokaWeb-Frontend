import { axiosClient } from '../../../api/axiosClient';
import type { WeeklySchedule } from '../types/weeklyScheduleTypes';

export async function generateWeeklySchedule(
  templateId: number,
): Promise<WeeklySchedule> {
  const response = await axiosClient.post<WeeklySchedule>(
    '/weekly-schedules/generate',
    { templateId },
  );

  return response.data;
}

export async function getWeeklyScheduleById(
  id: number,
): Promise<WeeklySchedule> {
  const response = await axiosClient.get<WeeklySchedule>(
    `/weekly-schedules/${id}`,
  );

  return response.data;
}

export async function getWeeklySchedules(): Promise<WeeklySchedule[]> {
  const response = await axiosClient.get<WeeklySchedule[]>('/weekly-schedules');

  return response.data;
}

export async function publishWeeklySchedule(
  id: number,
): Promise<WeeklySchedule> {
  const response = await axiosClient.patch<WeeklySchedule>(
    `/weekly-schedules/${id}/publish`,
  );

  return response.data;
}

export async function unpublishWeeklySchedule(
  id: number,
): Promise<WeeklySchedule> {
  const response = await axiosClient.patch<WeeklySchedule>(
    `/weekly-schedules/${id}/unpublish`,
  );

  return response.data;
}

export async function getPublishedWeeklySchedules(): Promise<WeeklySchedule[]> {
  const response = await axiosClient.get<WeeklySchedule[]>(
    '/weekly-schedules/published',
  );

  return response.data;
}

export async function deleteWeeklySchedule(id: number): Promise<void> {
  await axiosClient.delete(`/weekly-schedules/${id}`);
}

