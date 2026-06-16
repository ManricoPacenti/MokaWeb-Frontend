import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { getEmployees } from '../../employees/api/employeeService';
import type { Employee } from '../../employees/types/employeeTypes';
import { createStaffAccount } from '../api/createStaffAccount';

const FALLBACK_AVATAR =
  'https://ui-avatars.com/api/?name=New+Staff&background=64748B&color=ffffff';

export default function CreateStaffAccountPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    profileImageUrl: '',
    rawPassword: '',
    employeeId: '',
  });

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('LOAD EMPLOYEES ERROR:', error);
        setError('Unable to load employees.');
      } finally {
        setIsLoadingEmployees(false);
      }
    }

    loadEmployees();
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.currentTarget;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function validateForm(): string {
    if (!form.employeeId) return 'Select an employee to link.';
    if (!form.username.trim()) return 'Username is required.';
    if (!form.email.trim()) return 'Email is required.';

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(form.email)) return 'Invalid email.';

    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.rawPassword.trim()) return 'Password is required.';

    if (form.rawPassword.length < 8) {
      return 'Password must contain at least 8 characters.';
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
      await createStaffAccount({
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        profileImageUrl: form.profileImageUrl.trim(),
        rawPassword: form.rawPassword,
        employeeId: Number(form.employeeId),
      });

      navigate('/staff-accounts');
    } catch (error: any) {
      console.error('CREATE STAFF ACCOUNT ERROR:', error);

      if (error.response?.status === 409) {
        setError('An account with this email or username already exists.');
      } else if (error.response?.status === 400) {
        setError('Invalid data. Check the fields.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to create a staff account.');
      } else {
        setError('Unable to create staff account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Create Staff Account</h1>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoadingEmployees ? (
        <p className="text-white">Loading employees...</p>
      ) : (
        <form onSubmit={handleSubmit} className="card moka-soft-card p-4 shadow-sm">
          <section className="mb-4 d-flex align-items-center gap-3">
            <img
              src={form.profileImageUrl.trim() || FALLBACK_AVATAR}
              alt="Profile preview"
              width="72"
              height="72"
              className="rounded-circle border"
              style={{ objectFit: 'cover' }}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_AVATAR;
              }}
            />

            <div>
              <h2 className="h6 mb-1">Profile preview</h2>
              <p className="text-muted small mb-0">
                This image will be shown in the staff account list.
              </p>
            </div>
          </section>

          <div className="mb-3">
            <label className="form-label" htmlFor="employeeId">
              Linked employee
            </label>

            <select
              id="employeeId"
              name="employeeId"
              className="form-select"
              value={form.employeeId}
              onChange={handleChange}
            >
              <option value="">Select employee</option>

              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  #{employee.id} - {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
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

            <div className="col-md-6 mb-3">
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
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="username">
              Username
            </label>

            <input
              id="username"
              name="username"
              className="form-control"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="email">
              Login email
            </label>

            <input
              id="email"
              name="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="profileImageUrl">
              Profile image URL
            </label>

            <input
              id="profileImageUrl"
              name="profileImageUrl"
              className="form-control"
              value={form.profileImageUrl}
              onChange={handleChange}
              placeholder="https://example.com/profile.png"
            />
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="rawPassword">
              Password
            </label>

            <input
              id="rawPassword"
              name="rawPassword"
              type="password"
              className="form-control"
              value={form.rawPassword}
              onChange={handleChange}
            />
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn moka-btn"
              onClick={() => navigate('/staff-accounts')}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button type="submit" className="btn moka-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}