import { axiosClient } from '../../../api/axiosClient';
import type { LeaveType } from '../types/leaveRequestTypes';

export type CreateLeaveRequestPayload = {
  employeeId: number;
  leaveDate: string;
  startTime: string;
  endTime: string;
  leaveType: LeaveType;
  note?: string;
};

export async function createLeaveRequest(
  payload: CreateLeaveRequestPayload,
): Promise<void> {
  await axiosClient.post('/leave-requests', payload);
}