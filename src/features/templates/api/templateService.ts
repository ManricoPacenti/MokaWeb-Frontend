import { axiosClient } from '../../../api/axiosClient';
import type {
  CreateWeeklyScheduleTemplatePayload,
  TemplateHolidayWarningPreview,
  WeeklyScheduleTemplate,
} from '../types/templateTypes';

export async function getTemplates(): Promise<WeeklyScheduleTemplate[]> {
  const response = await axiosClient.get<WeeklyScheduleTemplate[]>(
    '/weekly-schedule-templates',
  );

  return response.data;
}

export async function getTemplateById(
  id: number,
): Promise<WeeklyScheduleTemplate> {
  const response = await axiosClient.get<WeeklyScheduleTemplate>(
    `/weekly-schedule-templates/${id}`,
  );

  return response.data;
}

export async function createTemplate(
  payload: CreateWeeklyScheduleTemplatePayload,
): Promise<WeeklyScheduleTemplate> {
  const response = await axiosClient.post<WeeklyScheduleTemplate>(
    '/weekly-schedule-templates',
    payload,
  );

  return response.data;
}

export async function getTemplateHolidayWarnings(
  weekStart: string,
): Promise<TemplateHolidayWarningPreview[]> {
  const response = await axiosClient.get<TemplateHolidayWarningPreview[]>(
    '/weekly-schedule-templates/holiday-warnings',
    {
      params: { weekStart },
    },
  );

  return response.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await axiosClient.delete(`/weekly-schedule-templates/${id}`);
}