import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import EmployeeTable from '../components/EmployeeTable';
import {
  getEmployees,
  updateEmployeeActive,
  updateEmployeeDetails,
} from '../api/employeeService';
import type {
  Employee,
  UpdateEmployeeDetailsPayload,
} from '../types/employeeTypes';

import {
  findStaffAccounts,
  type StaffAccountLookup,
} from '../../staffAccounts/api/staffAccountLookup';

type EmployeeFilter = 'ALL' | 'ACTIVE';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState<EmployeeFilter>('ALL');

  const [staffAccountsByEmployeeId, setStaffAccountsByEmployeeId] = useState<
    Record<number, StaffAccountLookup | null>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingEmployeeId, setIsUpdatingEmployeeId] = useState<number | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState('');

  const filteredEmployees = useMemo(() => {
    if (employeeFilter === 'ACTIVE') {
      return employees.filter((employee) => employee.active);
    }

    return employees;
  }, [employees, employeeFilter]);

  async function loadEmployees() {
    try {
      setErrorMessage('');

      const employeesData = await getEmployees();
      const staffAccounts = await findStaffAccounts();

      const staffAccountsMap: Record<number, StaffAccountLookup | null> = {};

      for (const employee of employeesData) {
        staffAccountsMap[employee.id] = null;
      }

      for (const account of staffAccounts) {
        staffAccountsMap[account.employeeId] = account;
      }

      setEmployees(employeesData);
      setStaffAccountsByEmployeeId(staffAccountsMap);
    } catch (error) {
      console.error('LOAD EMPLOYEES ERROR:', error);
      setErrorMessage('Unable to load employees.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleToggleActive(employee: Employee) {
    setIsUpdatingEmployeeId(employee.id);
    setErrorMessage('');

    try {
      const updatedEmployee = await updateEmployeeActive(
        employee.id,
        !employee.active,
      );

      setEmployees((previousEmployees) =>
        previousEmployees.map((currentEmployee) =>
          currentEmployee.id === updatedEmployee.id
            ? updatedEmployee
            : currentEmployee,
        ),
      );
    } catch (error) {
      console.error('UPDATE EMPLOYEE ACTIVE ERROR:', error);
      setErrorMessage('Unable to update employee status.');
    } finally {
      setIsUpdatingEmployeeId(null);
    }
  }

  async function handleUpdateDetails(
    employeeId: number,
    payload: UpdateEmployeeDetailsPayload,
  ) {
    setIsUpdatingEmployeeId(employeeId);
    setErrorMessage('');

    try {
      const updatedEmployee = await updateEmployeeDetails(employeeId, payload);

      setEmployees((previousEmployees) =>
        previousEmployees.map((currentEmployee) =>
          currentEmployee.id === updatedEmployee.id
            ? updatedEmployee
            : currentEmployee,
        ),
      );
    } catch (error) {
      console.error('UPDATE EMPLOYEE DETAILS ERROR:', error);
      setErrorMessage('Unable to update employee details.');
      throw error;
    } finally {
      setIsUpdatingEmployeeId(null);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Employee Management</h1>

        <div className="d-flex gap-2 flex-wrap">
          <Link to="/employees/new" className="btn moka-btn">
            + New Employee
          </Link>
        </div>
      </header>

      <section className="card moka-soft-card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="h6 mb-1">Employee filter</h2>
            <p className="text-muted mb-0">
              Total: {employees.length} — Active:{' '}
              {employees.filter((employee) => employee.active).length} —
              Inactive:{' '}
              {employees.filter((employee) => !employee.active).length}
            </p>
          </div>

          <div className="btn-group">
            <button
              type="button"
              className={
                employeeFilter === 'ALL'
                  ? 'btn moka-btn active'
                  : 'btn moka-btn'
              }
              onClick={() => setEmployeeFilter('ALL')}
            >
              All
            </button>

            <button
              type="button"
              className={
                employeeFilter === 'ACTIVE'
                  ? 'btn moka-btn active'
                  : 'btn moka-btn'
              }
              onClick={() => setEmployeeFilter('ACTIVE')}
            >
              Active only
            </button>
          </div>
        </div>
      </section>

      {isLoading && <p className="text-white">Loading employees...</p>}

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && filteredEmployees.length === 0 && (
        <div className="alert alert-warning" role="alert">
          No employees found.
        </div>
      )}

      {!isLoading && !errorMessage && filteredEmployees.length > 0 && (
        <EmployeeTable
          employees={filteredEmployees}
          staffAccountsByEmployeeId={staffAccountsByEmployeeId}
          onToggleActive={handleToggleActive}
          onUpdateDetails={handleUpdateDetails}
          updatingEmployeeId={isUpdatingEmployeeId}
        />
      )}
    </main>
  );
}