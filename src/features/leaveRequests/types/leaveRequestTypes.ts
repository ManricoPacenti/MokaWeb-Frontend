export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';

export type LeaveRequest = {
  id: number;
  employeeId: number;
  employeeFirstName: string | null;
  employeeLastName: string | null;
  leaveDate: string;
  startTime: string;
  endTime: string;
  leaveType: LeaveType;
  note: string;
  status: LeaveRequestStatus;
  requestedAt: string;
  reviewedAt: string | null;
};