import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  createTemplate,
  getTemplateHolidayWarnings,
} from '../api/templateService';
import {
  findAvailableEmployees,
  getEmployees,
} from '../../employees/api/employeeService';
import type {
  DayOfWeekValue,
  Employee,
  EmployeeSkillName,
} from '../../employees/types/employeeTypes';
import type { TemplateHolidayWarningPreview } from '../types/templateTypes';

const DAY_OPTIONS: DayOfWeekValue[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const SKILL_OPTIONS: EmployeeSkillName[] = [
  'BAR',
  'KITCHEN',
  'RESP',
  'RUNNER',
  'WAITER',
  'OPENING',
];

const SLOT_MINUTES = 30;

type TemplateZoomLevel = 'overview' | 'comfortable' | 'focus';

type SlotFormItem = {
  day: DayOfWeekValue | '';
  startTime: string;
  endTime: string;
  requiredSkill: EmployeeSkillName | '';
  employeeId: string;
};

type CompleteSlotFormItem = {
  day: DayOfWeekValue;
  startTime: string;
  endTime: string;
  requiredSkill: EmployeeSkillName;
  employeeId: string;
};

type PreviewSlot = CompleteSlotFormItem & {
  laneIndex: number;
};

type SkillColumn = {
  skill: EmployeeSkillName;
  laneIndex: number;
};

type SlotWarningMap = Record<number, string>;

function isCompleteSlot(slot: SlotFormItem): slot is CompleteSlotFormItem {
  return Boolean(
    slot.day &&
      slot.startTime &&
      slot.endTime &&
      slot.requiredSkill &&
      slot.startTime !== slot.endTime,
  );
}

function canCheckPreAssignment(slot: SlotFormItem, weekStart: string): boolean {
  return Boolean(
    weekStart &&
      slot.day &&
      slot.startTime &&
      slot.endTime &&
      slot.requiredSkill &&
      slot.employeeId,
  );
}

function resolveSlotDate(weekStart: string, day: DayOfWeekValue): string {
  const weekStartDate = new Date(`${weekStart}T00:00:00`);
  const weekStartDay = weekStartDate.getDay() === 0 ? 7 : weekStartDate.getDay();

  const targetDay =
    DAY_OPTIONS.findIndex((currentDay) => currentDay === day) + 1;

  const offset = (targetDay - weekStartDay + 7) % 7;

  const result = new Date(weekStartDate);
  result.setDate(weekStartDate.getDate() + offset);

  return result.toISOString().slice(0, 10);
}

function toMinute(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function crossesMidnight(slot: CompleteSlotFormItem): boolean {
  return toMinute(slot.endTime) < toMinute(slot.startTime);
}

function normalizedEndMinute(slot: CompleteSlotFormItem): number {
  const end = toMinute(slot.endTime);
  return crossesMidnight(slot) ? end + 24 * 60 : end;
}

function overlaps(
  first: CompleteSlotFormItem,
  second: CompleteSlotFormItem,
): boolean {
  const firstStart = toMinute(first.startTime);
  const firstEnd = normalizedEndMinute(first);

  const secondStart = toMinute(second.startTime);
  const secondEnd = normalizedEndMinute(second);

  return firstStart < secondEnd && secondStart < firstEnd;
}

function containsMinute(slot: CompleteSlotFormItem, minute: number): boolean {
  const start = toMinute(slot.startTime);
  const end = normalizedEndMinute(slot);

  return minute >= start && minute < end;
}

function formatMinute(minute: number): string {
  const normalized = minute % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}`;
}

function formatTimeWindow(minute: number): string {
  return `${formatMinute(minute)}-${formatMinute(minute + SLOT_MINUTES)}`;
}

function assignLanes(slots: CompleteSlotFormItem[]): PreviewSlot[] {
  const result: PreviewSlot[] = [];

  for (const slot of slots) {
    let laneIndex = 0;

    while (
      result.some(
        (existing) =>
          existing.requiredSkill === slot.requiredSkill &&
          existing.laneIndex === laneIndex &&
          overlaps(existing, slot),
      )
    ) {
      laneIndex += 1;
    }

    result.push({
      ...slot,
      laneIndex,
    });
  }

  return result;
}

function buildColumns(slots: PreviewSlot[]): SkillColumn[] {
  const skills = Array.from(new Set(slots.map((slot) => slot.requiredSkill)));

  return skills.flatMap((skill) => {
    const maxLane = Math.max(
      ...slots
        .filter((slot) => slot.requiredSkill === skill)
        .map((slot) => slot.laneIndex),
    );

    return Array.from({ length: maxLane + 1 }, (_, laneIndex) => ({
      skill,
      laneIndex,
    }));
  });
}

function getColumnLabel(column: SkillColumn): string {
  return column.laneIndex === 0
    ? column.skill
    : `${column.skill}#${column.laneIndex + 1}`;
}

function findCellSlot(
  slots: PreviewSlot[],
  minute: number,
  column: SkillColumn,
): PreviewSlot | undefined {
  return slots.find(
    (currentSlot) =>
      currentSlot.requiredSkill === column.skill &&
      currentSlot.laneIndex === column.laneIndex &&
      containsMinute(currentSlot, minute),
  );
}

function getEmployeeById(
  employeeId: string,
  employees: Employee[],
): Employee | undefined {
  if (!employeeId) return undefined;

  return employees.find(
    (currentEmployee) => currentEmployee.id === Number(employeeId),
  );
}

export default function CreateTemplatePage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [zoomLevel, setZoomLevel] = useState<TemplateZoomLevel>('comfortable');

  const [slots, setSlots] = useState<SlotFormItem[]>([
    {
      day: '',
      startTime: '',
      endTime: '',
      requiredSkill: '',
      employeeId: '',
    },
  ]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slotWarnings, setSlotWarnings] = useState<SlotWarningMap>({});
  const [holidayWarnings, setHolidayWarnings] = useState<
    TemplateHolidayWarningPreview[]
  >([]);

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingWarnings, setIsLoadingWarnings] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees();
        setEmployees(data.filter((employee) => employee.active));
      } catch (error) {
        console.error('LOAD EMPLOYEES ERROR:', error);
        setError('Unable to load employees.');
      } finally {
        setIsLoadingEmployees(false);
      }
    }

    loadEmployees();
  }, []);

  useEffect(() => {
    async function loadHolidayWarnings() {
      if (!weekStart) {
        setHolidayWarnings([]);
        return;
      }

      setIsLoadingWarnings(true);

      try {
        const warnings = await getTemplateHolidayWarnings(weekStart);
        setHolidayWarnings(warnings);
      } catch (error) {
        console.error('LOAD TEMPLATE HOLIDAY WARNINGS ERROR:', error);
        setHolidayWarnings([]);
      } finally {
        setIsLoadingWarnings(false);
      }
    }

    loadHolidayWarnings();
  }, [weekStart]);

  useEffect(() => {
    async function checkPreAssignments() {
      const warnings: SlotWarningMap = {};

      await Promise.all(
        slots.map(async (slot, index) => {
          if (!canCheckPreAssignment(slot, weekStart)) return;

          try {
            const slotDate = resolveSlotDate(
              weekStart,
              slot.day as DayOfWeekValue,
            );

            const availableEmployees = await findAvailableEmployees({
              skill: slot.requiredSkill as EmployeeSkillName,
              day: slotDate,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });

            const selectedEmployeeId = Number(slot.employeeId);
            const isSelectedEmployeeAvailable = availableEmployees.some(
              (employee) => employee.id === selectedEmployeeId,
            );

            if (!isSelectedEmployeeAvailable) {
              warnings[index] =
                'The selected employee does not have the required skill or is not available in this time window.';
            }
          } catch (error) {
            console.error('CHECK PRE-ASSIGNMENT ERROR:', error);
          }
        }),
      );

      setSlotWarnings(warnings);
    }

    checkPreAssignments();
  }, [slots, weekStart]);

  const previewSlotsByDay = useMemo(() => {
    return DAY_OPTIONS.reduce<Record<DayOfWeekValue, PreviewSlot[]>>(
      (groups, day) => {
        const validSlots = slots
          .filter((slot): slot is CompleteSlotFormItem =>
            Boolean(slot.day === day && isCompleteSlot(slot)),
          )
          .sort((a, b) => {
            const byStart = a.startTime.localeCompare(b.startTime);
            if (byStart !== 0) return byStart;

            return a.requiredSkill.localeCompare(b.requiredSkill);
          });

        groups[day] = assignLanes(validSlots);
        return groups;
      },
      {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
        SUNDAY: [],
      },
    );
  }, [slots]);

  function handleSlotChange(
    index: number,
    field: keyof SlotFormItem,
    value: string,
  ) {
    setSlots((previousSlots) =>
      previousSlots.map((slot, currentIndex) =>
        currentIndex === index
          ? {
              ...slot,
              [field]: value,
            }
          : slot,
      ),
    );
  }

  function addSlot() {
    setSlots((previousSlots) => [
      ...previousSlots,
      {
        day: '',
        startTime: '',
        endTime: '',
        requiredSkill: '',
        employeeId: '',
      },
    ]);
  }

  function removeSlot(index: number) {
    setSlots((previousSlots) =>
      previousSlots.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function validate(): string {
    if (!name.trim()) return 'Template name is required.';
    if (!weekStart) return 'Week start is required.';
    if (slots.length === 0) return 'Add at least one slot.';

    for (const slot of slots) {
      if (!slot.day) return 'Day is required for every slot.';
      if (!slot.startTime) return 'Start time is required for every slot.';
      if (!slot.endTime) return 'End time is required for every slot.';
      if (!slot.requiredSkill) {
        return 'Required skill is required for every slot.';
      }

      if (slot.endTime === slot.startTime) {
        return 'End time must be different from start time.';
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

    const cleanedSlots = slots.map((slot) => ({
      day: slot.day as DayOfWeekValue,
      startTime: slot.startTime,
      endTime: slot.endTime,
      requiredSkill: slot.requiredSkill as EmployeeSkillName,
      employeeId: slot.employeeId ? Number(slot.employeeId) : null,
    }));

    setError('');
    setIsSubmitting(true);

    try {
      const created = await createTemplate({
        name: name.trim(),
        weekStart,
        slots: cleanedSlots,
      });

      navigate(`/templates/${created.id}`);
    } catch (error: any) {
      console.error('CREATE TEMPLATE ERROR:', error);
      setError(error.response?.data?.message ?? 'Unable to create template.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">
          New Weekly Schedule Template
        </h1>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoadingEmployees && (
        <div className="alert alert-secondary">Loading employees...</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card moka-soft-card p-4 shadow-sm mb-4"
      >
        <div className="mb-3">
          <label className="form-label" htmlFor="name">
            Template name
          </label>

          <input
            id="name"
            className="form-control"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label" htmlFor="weekStart">
            Week start
          </label>

          <input
            id="weekStart"
            type="date"
            className="form-control"
            value={weekStart}
            onChange={(event) => setWeekStart(event.target.value)}
          />
        </div>

        {isLoadingWarnings && (
          <div className="alert alert-secondary">
            Checking holidays for the selected week...
          </div>
        )}

        {!isLoadingWarnings && holidayWarnings.length > 0 && (
          <div className="alert alert-warning">
            <h2 className="h6">Holidays in selected week</h2>

            <ul className="mb-0">
              {holidayWarnings.map((warning) => (
                <li key={`${warning.date}-${warning.holidayName}`}>
                  {warning.date} - {warning.holidayName} ({warning.dayOfWeek})
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="h5 mb-3">Required slots</h2>

        {slots.map((slot, index) => (
          <section key={index} className="border rounded p-3 mb-3 bg-light">
            <div className="mb-3">
              <label className="form-label" htmlFor={`day-${index}`}>
                Day
              </label>

              <select
                id={`day-${index}`}
                className="form-select"
                value={slot.day}
                onChange={(event) =>
                  handleSlotChange(
                    index,
                    'day',
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
                  value={slot.startTime}
                  onChange={(event) =>
                    handleSlotChange(index, 'startTime', event.target.value)
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
                  value={slot.endTime}
                  onChange={(event) =>
                    handleSlotChange(index, 'endTime', event.target.value)
                  }
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor={`skill-${index}`}>
                Required skill
              </label>

              <select
                id={`skill-${index}`}
                className="form-select"
                value={slot.requiredSkill}
                onChange={(event) =>
                  handleSlotChange(
                    index,
                    'requiredSkill',
                    event.target.value as EmployeeSkillName | '',
                  )
                }
              >
                <option value="">Select skill</option>

                {SKILL_OPTIONS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor={`employee-${index}`}>
                Pre-assigned employee
              </label>

              <select
                id={`employee-${index}`}
                className="form-select"
                value={slot.employeeId}
                onChange={(event) =>
                  handleSlotChange(index, 'employeeId', event.target.value)
                }
                disabled={isLoadingEmployees}
              >
                <option value="">Automatic assignment</option>

                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    #{employee.id} - {employee.firstName} {employee.lastName} (
                    {employee.priority}, {employee.agreedHours}h)
                  </option>
                ))}
              </select>

              <div className="form-text">
                Manual pre-assignment will be preserved by the scheduler.
              </div>

              {slotWarnings[index] && (
                <div className="text-warning small mt-1">
                  {slotWarnings[index]}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-sm moka-btn"
              onClick={() => removeSlot(index)}
              disabled={slots.length === 1}
            >
              Remove slot
            </button>
          </section>
        ))}

        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn moka-btn"
            onClick={() => navigate('/templates')}
          >
            Cancel
          </button>

          <button type="button" className="btn moka-btn" onClick={addSlot}>
            + Add slot
          </button>

          <button
            type="submit"
            className="btn moka-btn"
            disabled={isSubmitting || isLoadingEmployees}
          >
            {isSubmitting ? 'Creating...' : 'Create template'}
          </button>
        </div>
      </form>

      <section className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <h2 className="dashboard-menu-title h4 mb-0">Template Preview</h2>

          <div className="btn-group">
            <button
              type="button"
              className={
                zoomLevel === 'overview'
                  ? 'btn moka-btn active'
                  : 'btn moka-btn'
              }
              onClick={() => setZoomLevel('overview')}
            >
              Overview
            </button>

            <button
              type="button"
              className={
                zoomLevel === 'comfortable'
                  ? 'btn moka-btn active'
                  : 'btn moka-btn'
              }
              onClick={() => setZoomLevel('comfortable')}
            >
              Normal
            </button>

            <button
              type="button"
              className={
                zoomLevel === 'focus' ? 'btn moka-btn active' : 'btn moka-btn'
              }
              onClick={() => setZoomLevel('focus')}
            >
              Focus
            </button>
          </div>
        </div>

        {DAY_OPTIONS.every((day) => previewSlotsByDay[day].length === 0) && (
          <div className="alert alert-secondary">
            Add at least one complete slot to preview the weekly grid.
          </div>
        )}

        <div className={`template-days-board template-days-board-${zoomLevel}`}>
          {DAY_OPTIONS.map((day) => {
            const daySlots = previewSlotsByDay[day];

            if (daySlots.length === 0) return null;

            const columns = buildColumns(daySlots);
            const minMinute = Math.min(
              ...daySlots.map((slot) => toMinute(slot.startTime)),
            );
            const maxMinute = Math.max(...daySlots.map(normalizedEndMinute));

            return (
              <section
                key={day}
                className="card moka-soft-card shadow-sm template-day-card"
              >
                <div className="card-header moka-soft-card-header">
                  <h3 className="h6 mb-0">
                    {day}
                    {weekStart ? ` — ${resolveSlotDate(weekStart, day)}` : ''}
                  </h3>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle mb-0 template-grid-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '100px' }}>TIME</th>

                        {columns.map((column) => (
                          <th
                            key={`${day}-${column.skill}-${column.laneIndex}`}
                            style={{ minWidth: '120px' }}
                          >
                            {getColumnLabel(column)}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {Array.from(
                        {
                          length: Math.ceil(
                            (maxMinute - minMinute) / SLOT_MINUTES,
                          ),
                        },
                        (_, currentIndex) =>
                          minMinute + currentIndex * SLOT_MINUTES,
                      ).map((minute) => (
                        <tr key={`${day}-${minute}`}>
                          <td className="fw-semibold">
                            {formatTimeWindow(minute)}
                          </td>

                          {columns.map((column) => {
                            const slot = findCellSlot(daySlots, minute, column);
                            const employee = slot?.employeeId
                              ? getEmployeeById(slot.employeeId, employees)
                              : undefined;

                            return (
                              <td
                                key={`${day}-${minute}-${column.skill}-${column.laneIndex}`}
                              >
                                {slot ? (
                                  employee ? (
                                    <span
                                      className="fw-semibold px-2 py-1 rounded d-inline-block"
                                      style={{
                                        backgroundColor:
                                          employee.displayColor ?? '#6C757D',
                                        color: '#fff',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                      }}
                                    >
                                      {employee.firstName} {employee.lastName}
                                    </span>
                                  ) : (
                                    <span className="badge text-bg-warning">
                                      {slot.requiredSkill}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}