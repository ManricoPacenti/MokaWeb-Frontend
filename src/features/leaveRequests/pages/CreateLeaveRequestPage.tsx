import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '../../../app/hooks';
import { createLeaveRequest } from '../api/createLeaveRequest';

export default function CreateLeaveRequestPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [form, setForm] = useState({
    leaveDate: '',
    startTime: '',
    endTime: '',
    leaveType: 'VACATION' as const,
    note: '',
    fullDay: false,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = event.target;

    if (type === 'checkbox') {
      const checked = (event.target as HTMLInputElement).checked;

      setForm((previousForm) => ({
        ...previousForm,
        [name]: checked,
        startTime: checked ? '00:00' : '',
        endTime: checked ? '23:59' : '',
      }));

      return;
    }

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function validate(): string {
    if (!form.leaveDate) return 'Date is required.';

    if (!form.fullDay) {
      if (!form.startTime) return 'Start time is required.';
      if (!form.endTime) return 'End time is required.';

      if (form.endTime <= form.startTime) {
        return 'End time must be after start time. To cover the whole day, select “Full day”.';
      }
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.employeeId) {
      setError('Your account is not linked to an employee profile.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createLeaveRequest({
        employeeId: user.employeeId,
        leaveDate: form.leaveDate,
        startTime: form.fullDay ? '00:00' : form.startTime,
        endTime: form.fullDay ? '23:59' : form.endTime,
        leaveType: form.leaveType,
        note: form.note,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('CREATE LEAVE ERROR:', error);

      if (error.response?.status === 403) {
        setError(
          `Too late! Someone has already requested leave for this day. Please contact your manager to see what can be done.`,
        );
      } else if (error.response?.status === 400) {
        setError('Invalid data. Please check the fields.');
      } else {
        setError('Unable to create leave request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Request Leave</h1>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card moka-soft-card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label" htmlFor="leaveDate">
            Date
          </label>

          <input
            id="leaveDate"
            type="date"
            name="leaveDate"
            className="form-control"
            value={form.leaveDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-check mb-3">
          <input
            id="fullDay"
            type="checkbox"
            name="fullDay"
            className="form-check-input"
            checked={form.fullDay}
            onChange={handleChange}
          />

          <label className="form-check-label" htmlFor="fullDay">
            Full day
          </label>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="startTime">
              Start time
            </label>

            <input
              id="startTime"
              type="time"
              name="startTime"
              className="form-control"
              value={form.startTime}
              onChange={handleChange}
              disabled={form.fullDay}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="endTime">
              End time
            </label>

            <input
              id="endTime"
              type="time"
              name="endTime"
              className="form-control"
              value={form.endTime}
              onChange={handleChange}
              disabled={form.fullDay}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="leaveType">
            Leave type
          </label>

          <select
            id="leaveType"
            name="leaveType"
            className="form-select"
            value={form.leaveType}
            onChange={handleChange}
          >
            <option value="VACATION">VACATION</option>
            <option value="SICK">SICK</option>
            <option value="PERSONAL">PERSONAL</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="form-label" htmlFor="note">
            Note
          </label>

          <textarea
            id="note"
            name="note"
            className="form-control"
            value={form.note}
            onChange={handleChange}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn moka-btn"
            onClick={() => navigate('/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button type="submit" className="btn moka-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Submit request'}
          </button>
        </div>
      </form>
    </main>
  );
}