/**
 * bridge between frontend to backend's DTO
 */
export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'FINANCIAL_ADVISOR';

export interface LoginRequest {
  email: string;
  rawPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  userId: number;
  username: string;
  role: Role;
}

export interface MeResponse {
  id?: number;
  userId?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  role: Role;
  employeeId?: number | null;
}

export interface AuthState {
    token: string | null;
    user: MeResponse | null;
    loading: boolean;
    error: string | null;
  }