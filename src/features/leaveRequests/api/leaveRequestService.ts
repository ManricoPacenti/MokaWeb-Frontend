import { axiosClient } from '../../../api/axiosClient';
import type { LeaveRequest } from '../types/leaveRequestTypes';

export async function searchLeaveRequests(): Promise<LeaveRequest[]> {
  const response = await axiosClient.get<LeaveRequest[]>(
    '/leave-requests/search',
  );

  return response.data;
}

export async function approveLeaveRequest(id: number): Promise<void> {
  await axiosClient.patch(`/leave-requests/${id}/approve`);
}

export async function rejectLeaveRequest(id: number): Promise<void> {
  await axiosClient.patch(`/leave-requests/${id}/reject`);
}