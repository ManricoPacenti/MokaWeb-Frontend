import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from './app/hooks';
import { loadCurrentUser } from './features/auth/authSlice';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

import EmployeesPage from './features/employees/pages/EmployeesPage';
import CreateEmployeePage from './features/employees/pages/CreateEmployeePage';
import UpdateEmployeeSkillsPage from './features/employees/pages/UpdateEmployeeSkillsPage';
import UpdateEmployeeAvailabilityPage from './features/employees/pages/UpdateEmployeeAvailabilityPage';

import CreateStaffAccountPage from './features/staffAccounts/pages/CreateStaffAccountPage';
import StaffAccountsPage from './features/staffAccounts/pages/StaffAccountsPage';

import LeaveRequestsPage from './features/leaveRequests/pages/LeaveRequestsPage';
import CreateLeaveRequestPage from './features/leaveRequests/pages/CreateLeaveRequestPage';

import TemplatesPage from './features/templates/pages/TemplatesPage';
import CreateTemplatePage from './features/templates/pages/CreateTemplatePage';
import TemplateDetailPage from './features/templates/pages/TemplateDetailPage';

import WeeklySchedulesPage from './features/weeklySchedules/pages/WeeklySchedulesPage';
import WeeklyScheduleDetailPage from './features/weeklySchedules/pages/WeeklyScheduleDetailPage';
import MySchedulePage from './features/weeklySchedules/pages/MySchedulePage';

import CreateManagerAccountPage from './features/managerAccounts/pages/CreateManagerAccountPage';
import ManagerAccountsPage from './features/managerAccounts/pages/ManagerAccountsPage';

import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

export default function App() {
  const dispatch = useAppDispatch();

  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  useEffect(() => {
    if (token && !user && !loading) {
      dispatch(loadCurrentUser());
    }
  }, [dispatch, token, user, loading]);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Manager routes */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <EmployeesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees/new"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <CreateEmployeePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees/:id/skills"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <UpdateEmployeeSkillsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees/:id/availability"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <UpdateEmployeeAvailabilityPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-accounts/new"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <CreateStaffAccountPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-accounts"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <StaffAccountsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leave-requests"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <LeaveRequestsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <TemplatesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates/new"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <CreateTemplatePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates/:id"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <TemplateDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/weekly-schedules"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <WeeklySchedulesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/weekly-schedules/:id"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppLayout>
              <WeeklyScheduleDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Staff routes */}
      <Route
        path="/leave-requests/new"
        element={
          <ProtectedRoute allowedRoles={['STAFF']}>
            <AppLayout>
              <CreateLeaveRequestPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-schedule"
        element={
          <ProtectedRoute allowedRoles={['STAFF']}>
            <AppLayout>
              <MySchedulePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/manager-accounts/new"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <CreateManagerAccountPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager-accounts"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout>
              <ManagerAccountsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}