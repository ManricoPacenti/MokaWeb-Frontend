import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type {
  Employee,
  EmployeePriority,
  UpdateEmployeeDetailsPayload,
} from '../types/employeeTypes';
import type { StaffAccountLookup } from '../../staffAccounts/api/staffAccountLookup';

type EmployeeTableProps = {
  employees: Employee[];
  staffAccountsByEmployeeId: Record<number, StaffAccountLookup | null>;
  onToggleActive: (employee: Employee) => void;
  onUpdateDetails: (
    employeeId: number,
    payload: UpdateEmployeeDetailsPayload,
  ) => Promise<void>;
  updatingEmployeeId: number | null;
};

//Local state used by the inline employee editor
type EditFormState = {
  priority: EmployeePriority;
  agreedHours: string;
  hourlyCost: string;
  displayColor: string;
};

export default function EmployeeTable({
  employees,
  staffAccountsByEmployeeId,
  onToggleActive,
  onUpdateDetails,
  updatingEmployeeId,
}: EmployeeTableProps) {
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    priority: 'MEDIUM',
    agreedHours: '0',
    hourlyCost: '0',
    displayColor: '#64748B',
  });
  const [editError, setEditError] = useState('');

  //Opens inline edit mode and preloads current employee data
  function startEditing(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setEditError('');
    setEditForm({
      priority: employee.priority,
      agreedHours: String(employee.agreedHours),
      hourlyCost: String(employee.hourlyCost),
      displayColor: employee.displayColor || '#64748B',
    });
  }

  function cancelEditing() {
    setEditingEmployeeId(null);
    setEditError('');
  }

  function handleEditChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.currentTarget;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  //client-side validation before sending data to the backend
  function validateEditForm(): string {
    const agreedHours = Number(editForm.agreedHours);
    const hourlyCost = Number(editForm.hourlyCost);

    if (Number.isNaN(agreedHours) || agreedHours < 0) {
      return 'Invalid agreed hours.';
    }

    if (Number.isNaN(hourlyCost) || hourlyCost < 0) {
      return 'Invalid hourly cost.';
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(editForm.displayColor)) {
      return 'Invalid color. Use HEX format, for example #64748B.';
    }

    return '';
  }

  async function handleSubmitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingEmployeeId === null) return;

    const validationError = validateEditForm();

    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditError('');

    await onUpdateDetails(editingEmployeeId, {
      priority: editForm.priority,
      agreedHours: Number(editForm.agreedHours),
      hourlyCost: Number(editForm.hourlyCost),
      displayColor: editForm.displayColor,
    });

    setEditingEmployeeId(null);
  }

  //Updates employee display color immediatly after selection (await)
  async function handleColorChange(employee: Employee, displayColor: string) {
    await onUpdateDetails(employee.id, {
      priority: employee.priority,
      agreedHours: employee.agreedHours,
      hourlyCost: employee.hourlyCost,
      displayColor,
    });
  }

  return (
    <section className="card moka-soft-card shadow-sm">
      <div className="card-header moka-soft-card-header">
        <h2 className="h5 mb-0">Employees list</h2>
      </div>

      <div className="table-responsive">
        <table className="table table-hover mb-0 align-middle moka-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Color</th>
              <th>Priority</th>
              <th>Hours</th>
              <th>Cost/h</th>
              <th>Status</th>
              <th>Staff access</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee) => {
              const staffAccount = staffAccountsByEmployeeId[employee.id];
              const isUpdating = updatingEmployeeId === employee.id;
              const isEditing = editingEmployeeId === employee.id;
              const employeeColor = employee.displayColor || '#64748B';

              return (
                <tr
                  key={employee.id}
                  className={!employee.active ? 'table-secondary' : ''}
                >
                  <td>{employee.id}</td>

                  <td>
                    <div className="fw-semibold">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-muted small">
                      Employee ID: {employee.id}
                    </div>
                  </td>

                  <td>
                    <input
                      type="color"
                      className="employee-color-picker"
                      value={employeeColor}
                      title={`Change color for ${employee.firstName} ${employee.lastName}`}
                      disabled={isUpdating}
                      onChange={(event) =>
                        handleColorChange(employee, event.target.value)
                      }
                    />
                  </td>

                  <td>
                    <span className="badge text-bg-dark">
                      {employee.priority}
                    </span>
                  </td>

                  <td>{employee.agreedHours}h</td>

                  <td>€ {employee.hourlyCost}</td>

                  <td>
                    {employee.active ? (
                      <span className="badge text-bg-success">Active</span>
                    ) : (
                      <span className="badge text-bg-secondary">Inactive</span>
                    )}
                  </td>

                  <td>
                    {staffAccount ? (
                      <div>
                        <div className="mb-1">
                          <span className="badge text-bg-primary me-2">
                            Linked
                          </span>

                          {staffAccount.enabled ? (
                            <span className="badge text-bg-success">
                              Enabled
                            </span>
                          ) : (
                            <span className="badge text-bg-danger">
                              Disabled
                            </span>
                          )}
                        </div>

                        <div className="fw-semibold">
                          {staffAccount.username}
                        </div>

                        <div className="text-muted small">
                          {staffAccount.email}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="badge text-bg-warning mb-1">
                          Not linked
                        </span>
                        <div className="text-muted small">
                          No login account linked
                        </div>
                      </div>
                    )}
                  </td>

                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      <Link
                        to={`/employees/${employee.id}/skills`}
                        className="btn btn-sm moka-btn"
                      >
                        Skills
                      </Link>

                      <Link
                        to={`/employees/${employee.id}/availability`}
                        className="btn btn-sm moka-btn"
                      >
                        Availability
                      </Link>

                      {!staffAccount && (
                        <Link
                          to={`/staff-accounts/new?employeeId=${employee.id}`}
                          className="btn btn-sm moka-btn"
                        >
                          Create account
                        </Link>
                      )}

                      <button
                        type="button"
                        className="btn btn-sm moka-btn"
                        onClick={() => startEditing(employee)}
                        disabled={isUpdating}
                      >
                        Edit details
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm moka-btn"
                        onClick={() => onToggleActive(employee)}
                        disabled={isUpdating}
                      >
                        {isUpdating
                          ? 'Updating...'
                          : employee.active
                            ? 'Deactivate'
                            : 'Reactivate'}
                      </button>
                    </div>

                    {isEditing && (
                      <form
                        className="border rounded p-3 mt-3 bg-light"
                        onSubmit={handleSubmitEdit}
                      >
                        {editError && (
                          <div className="alert alert-danger py-2">
                            {editError}
                          </div>
                        )}

                        <div className="row g-2">
                          <div className="col-md-6">
                            <label
                              className="form-label small"
                              htmlFor={`priority-${employee.id}`}
                            >
                              Priority
                            </label>

                            <select
                              id={`priority-${employee.id}`}
                              name="priority"
                              className="form-select form-select-sm"
                              value={editForm.priority}
                              onChange={handleEditChange}
                            >
                              <option value="LOW">LOW</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="HIGH">HIGH</option>
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label
                              className="form-label small"
                              htmlFor={`displayColor-${employee.id}`}
                            >
                              Color
                            </label>

                            <input
                              id={`displayColor-${employee.id}`}
                              name="displayColor"
                              type="color"
                              className="form-control form-control-color"
                              value={editForm.displayColor}
                              onChange={handleEditChange}
                            />
                          </div>

                          <div className="col-md-6">
                            <label
                              className="form-label small"
                              htmlFor={`agreedHours-${employee.id}`}
                            >
                              Agreed hours
                            </label>

                            <input
                              id={`agreedHours-${employee.id}`}
                              name="agreedHours"
                              type="number"
                              min="0"
                              className="form-control form-control-sm"
                              value={editForm.agreedHours}
                              onChange={handleEditChange}
                            />
                          </div>

                          <div className="col-md-6">
                            <label
                              className="form-label small"
                              htmlFor={`hourlyCost-${employee.id}`}
                            >
                              Hourly cost
                            </label>

                            <input
                              id={`hourlyCost-${employee.id}`}
                              name="hourlyCost"
                              type="number"
                              min="0"
                              className="form-control form-control-sm"
                              value={editForm.hourlyCost}
                              onChange={handleEditChange}
                            />
                          </div>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                          <button
                            type="submit"
                            className="btn btn-sm moka-btn"
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Saving...' : 'Save details'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm moka-btn"
                            onClick={cancelEditing}
                            disabled={isUpdating}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}