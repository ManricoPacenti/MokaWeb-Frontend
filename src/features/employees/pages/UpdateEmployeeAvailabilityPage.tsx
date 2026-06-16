import { useEffect, useState } from 'react';
import type { FormEventHandler } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getEmployeeById } from '../api/employeeService';
import { updateEmployeeAvailability } from '../api/updateEmployeeAvailability';
import type { DayOfWeekValue } from '../types/employeeTypes';

const DAY_OPTIONS: DayOfWeekValue[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

type WeeklyTimeOffFormItem = {
  dayOfWeek: DayOfWeekValue | '';
  startTime: string;
  endTime: string;
};

export default function UpdateEmployeeAvailabilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const employeeId = Number(id);

  const [employeeName, setEmployeeName] = useState('');
  const [fullDaysOff, setFullDaysOff] = useState<DayOfWeekValue[]>([]);
  const [weeklyTimeOff, setWeeklyTimeOff] = useState<WeeklyTimeOffFormItem[]>([
    {
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEmployee() {
      if (!employeeId || Number.isNaN(employeeId)) {
        setError('Invalid employee ID.');
        setIsLoading(false);
        return;
      }

      try {
        const employee = await getEmployeeById(employeeId);

        setEmployeeName(`${employee.firstName} ${employee.lastName}`);
        setFullDaysOff(employee.fullDaysOff.map((item) => item.dayOfWeek));

        if (employee.weeklyTimeOff.length > 0) {
          setWeeklyTimeOff(
            employee.weeklyTimeOff.map((item) => ({
              dayOfWeek: item.dayOfWeek,
              startTime: item.startTime.slice(0, 5),
              endTime: item.endTime.slice(0, 5),
            })),
          );
        }
      } catch (error) {
        console.error('LOAD EMPLOYEE AVAILABILITY ERROR:', error);
        setError('Unable to load employee availability.');
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployee();
  }, [employeeId]);

  function toggleFullDayOff(day: DayOfWeekValue) {
    setFullDaysOff((previousDays) =>
      previousDays.includes(day)
        ? previousDays.filter((currentDay) => currentDay !== day)
        : [...previousDays, day],
    );
  }

  function handleWeeklyTimeOffChange(
    index: number,
    field: 'dayOfWeek' | 'startTime' | 'endTime',
    value: DayOfWeekValue | string,
  ) {
    setWeeklyTimeOff((previousItems) =>
      previousItems.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addWeeklyTimeOff() {
    setWeeklyTimeOff((previousItems) => [
      ...previousItems,
      {
        dayOfWeek: '',
        startTime: '',
        endTime: '',
      },
    ]);
  }

  function removeWeeklyTimeOff(index: number) {
    setWeeklyTimeOff((previousItems) =>
      previousItems.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function validate(): string {
    if (!employeeId || Number.isNaN(employeeId)) {
      return 'Invalid employee ID.';
    }

    const completedTimeOff = weeklyTimeOff.filter(
      (item) => item.dayOfWeek || item.startTime || item.endTime,
    );

    for (const item of completedTimeOff) {
      if (!item.dayOfWeek) {
        return 'Please select a day for each time-off range.';
      }

      if (!item.startTime) {
        return 'Please enter a start time for each time-off range.';
      }

      if (!item.endTime) {
        return 'Please enter an end time for each time-off range.';
      }

      if (item.endTime <= item.startTime) {
        return 'End time must be after start time.';
      }

      if (fullDaysOff.includes(item.dayOfWeek)) {
        return 'You cannot add a time-off range for a full day off.';
      }
    }

    return '';
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    const cleanedWeeklyTimeOff = weeklyTimeOff
      .filter((item) => item.dayOfWeek && item.startTime && item.endTime)
      .map((item) => ({
        dayOfWeek: item.dayOfWeek as DayOfWeekValue,
        startTime: item.startTime,
        endTime: item.endTime,
      }));

    setError('');
    setIsSubmitting(true);

    try {
      await updateEmployeeAvailability(employeeId, {
        fullDaysOff,
        weeklyTimeOff: cleanedWeeklyTimeOff,
      });

      navigate('/employees');
    } catch (error: any) {
      console.error('UPDATE AVAILABILITY ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      if (error.response?.status === 400) {
        setError('Invalid data. Please check days and time ranges.');
      } else if (error.response?.status === 403) {
        setError('You are not allowed to update availability.');
      } else {
        setError('Unable to update employee availability.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container py-5">
        <p>Loading availability...</p>
      </main>
    );
  }

  return (
    <main className="container py-5">
      <header className="mb-4">
        <h1>Update Availability</h1>
        <p className="text-muted mb-0">
          {employeeName
            ? `Configure weekly unavailability for ${employeeName}.`
            : 'Configure weekly unavailability for the selected employee.'}
        </p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <section className="mb-4">
          <h2 className="h5">Full days off</h2>

          <div className="d-flex flex-wrap gap-3 mt-3">
            {DAY_OPTIONS.map((day) => (
              <div key={day} className="form-check">
                <input
                  id={`full-day-${day}`}
                  type="checkbox"
                  className="form-check-input"
                  checked={fullDaysOff.includes(day)}
                  onChange={() => toggleFullDayOff(day)}
                />

                <label
                  className="form-check-label"
                  htmlFor={`full-day-${day}`}
                >
                  {day}
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h2 className="h5">Time-off ranges</h2>

          {weeklyTimeOff.map((item, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="mb-3">
                <label className="form-label" htmlFor={`day-${index}`}>
                  Day
                </label>

                <select
                  id={`day-${index}`}
                  className="form-select"
                  value={item.dayOfWeek}
                  onChange={(event) =>
                    handleWeeklyTimeOffChange(
                      index,
                      'dayOfWeek',
                      event.target.value as DayOfWeekValue | '',
                    )
                  }
                >
                  <option value="">Select day</option>

                  {DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor={`start-${index}`}>
                    Start time
                  </label>

                  <input
                    id={`start-${index}`}
                    type="time"
                    className="form-control"
                    value={item.startTime}
                    onChange={(event) =>
                      handleWeeklyTimeOffChange(
                        index,
                        'startTime',
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor={`end-${index}`}>
                    End time
                  </label>

                  <input
                    id={`end-${index}`}
                    type="time"
                    className="form-control"
                    value={item.endTime}
                    onChange={(event) =>
                      handleWeeklyTimeOffChange(
                        index,
                        'endTime',
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => removeWeeklyTimeOff(index)}
                disabled={weeklyTimeOff.length === 1}
              >
                Remove range
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={addWeeklyTimeOff}
          >
            + Add range
          </button>
        </section>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save availability'}
        </button>
      </form>
    </main>
  );
}