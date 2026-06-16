import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { createEmployee } from '../api/createEmployee';
import type { EmployeePriority } from '../types/employeeTypes';

export default function CreateEmployeePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    active: true,
    priority: 'MEDIUM' as EmployeePriority,
    agreedHours: '20',
    hourlyCost: '0',
    displayColor: '#64748B',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const target = event.currentTarget;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((previousForm) => ({
        ...previousForm,
        [name]: target.checked,
      }));

      return;
    }

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function validateForm(): string {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';

    const agreedHours = Number(form.agreedHours);
    const hourlyCost = Number(form.hourlyCost);

    if (Number.isNaN(agreedHours) || agreedHours < 0) {
      return 'Invalid agreed hours.';
    }

    if (Number.isNaN(hourlyCost) || hourlyCost < 0) {
      return 'Invalid hourly cost.';
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(form.displayColor)) {
      return 'Invalid color. Use HEX format, for example #64748B.';
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createEmployee({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        active: form.active,
        priority: form.priority,
        agreedHours: Number(form.agreedHours),
        hourlyCost: Number(form.hourlyCost),
        displayColor: form.displayColor,
      });

      navigate('/employees');
    } catch (error: any) {
      console.error('CREATE EMPLOYEE ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      setError(error.response?.data?.message ?? 'Unable to create employee.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Create Employee</h1>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card moka-soft-card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label" htmlFor="firstName">
            First name
          </label>

          <input
            id="firstName"
            name="firstName"
            className="form-control"
            value={form.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="lastName">
            Last name
          </label>

          <input
            id="lastName"
            name="lastName"
            className="form-control"
            value={form.lastName}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="priority">
            Scheduler priority
          </label>

          <select
            id="priority"
            name="priority"
            className="form-select"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="displayColor">
            Display color
          </label>

          <div className="d-flex align-items-center gap-3">
            <input
              id="displayColor"
              name="displayColor"
              type="color"
              className="form-control form-control-color"
              value={form.displayColor}
              onChange={handleChange}
            />

            <span
              className="employee-color-dot"
              style={{ backgroundColor: form.displayColor }}
              title={form.displayColor}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="agreedHours">
              Weekly agreed hours
            </label>

            <input
              id="agreedHours"
              name="agreedHours"
              type="number"
              min="0"
              className="form-control"
              value={form.agreedHours}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="hourlyCost">
              Hourly cost
            </label>

            <input
              id="hourlyCost"
              name="hourlyCost"
              type="number"
              min="0"
              className="form-control"
              value={form.hourlyCost}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-check mb-4">
          <input
            id="active"
            type="checkbox"
            name="active"
            className="form-check-input"
            checked={form.active}
            onChange={handleChange}
          />

          <label className="form-check-label" htmlFor="active">
            Active
          </label>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn moka-btn"
            onClick={() => navigate('/employees')}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button type="submit" className="btn moka-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </main>
  );
}