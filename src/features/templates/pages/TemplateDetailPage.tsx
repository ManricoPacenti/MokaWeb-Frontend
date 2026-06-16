import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../components/BackButton';

import { getTemplateById } from '../api/templateService';
import type { TemplateSlot, WeeklyScheduleTemplate } from '../types/templateTypes';
import { generateWeeklySchedule } from '../../weeklySchedules/api/weeklyScheduleService';

import { getEmployees } from '../../employees/api/employeeService';
import type { DayOfWeekValue, Employee, EmployeeSkillName } from '../../employees/types/employeeTypes';

const DAY_ORDER: DayOfWeekValue[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const SLOT_MINUTES = 30;

type PreviewSlot = TemplateSlot & {
  laneIndex: number;
};

type SkillColumn = {
  skill: EmployeeSkillName;
  laneIndex: number;
};

type TemplateZoomLevel = 'overview' | 'comfortable' | 'focus';

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function toMinute(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function crossesMidnight(slot: TemplateSlot): boolean {
  return toMinute(slot.endTime) < toMinute(slot.startTime);
}

function normalizedEndMinute(slot: TemplateSlot): number {
  const end = toMinute(slot.endTime);
  return crossesMidnight(slot) ? end + 24 * 60 : end;
}

function overlaps(first: TemplateSlot, second: TemplateSlot): boolean {
  const firstStart = toMinute(first.startTime);
  const firstEnd = normalizedEndMinute(first);

  const secondStart = toMinute(second.startTime);
  const secondEnd = normalizedEndMinute(second);

  return firstStart < secondEnd && secondStart < firstEnd;
}

function containsMinute(slot: TemplateSlot, minute: number): boolean {
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

function resolveDate(weekStart: string, day: DayOfWeekValue): string {
  const weekStartDate = new Date(`${weekStart}T00:00:00`);
  const weekStartDay = weekStartDate.getDay() === 0 ? 7 : weekStartDate.getDay();
  const targetDay = DAY_ORDER.findIndex((currentDay) => currentDay === day) + 1;
  const offset = (targetDay - weekStartDay + 7) % 7;

  const result = new Date(weekStartDate);
  result.setDate(weekStartDate.getDate() + offset);

  return result.toISOString().slice(0, 10);
}

function assignLanes(slots: TemplateSlot[]): PreviewSlot[] {
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

function findCellValue(
  slots: PreviewSlot[],
  minute: number,
  column: SkillColumn,
  employees: Employee[],
): string {
  const slot = slots.find(
    (currentSlot) =>
      currentSlot.requiredSkill === column.skill &&
      currentSlot.laneIndex === column.laneIndex &&
      containsMinute(currentSlot, minute),
  );

  if (!slot) return '';

  if (!slot.employeeId) return slot.requiredSkill;

  const employee = employees.find(
    (currentEmployee) => currentEmployee.id === slot.employeeId,
  );

  if (!employee) return `Employee #${slot.employeeId}`;

  return `${employee.firstName} ${employee.lastName}`;
}

export default function TemplateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const templateId = Number(id);

  const [template, setTemplate] = useState<WeeklyScheduleTemplate | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] =
    useState<TemplateZoomLevel>('comfortable');

  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTemplate() {
      if (!templateId || Number.isNaN(templateId)) {
        setError('Invalid template ID.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getTemplateById(templateId);
        setTemplate(data);
      } catch (error) {
        console.error('LOAD TEMPLATE DETAIL ERROR:', error);
        setError('Unable to load template.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplate();
  }, [templateId]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('LOAD EMPLOYEES ERROR:', error);
      }
    }

    loadEmployees();
  }, []);

  const previewSlotsByDay = useMemo(() => {
    if (!template) return {};

    return DAY_ORDER.reduce<Record<string, PreviewSlot[]>>((groups, day) => {
      const validSlots = template.slots
        .filter((slot) => slot.day === day)
        .sort((a, b) => {
          const byStart = a.startTime.localeCompare(b.startTime);
          if (byStart !== 0) return byStart;

          return a.requiredSkill.localeCompare(b.requiredSkill);
        });

      groups[day] = assignLanes(validSlots);
      return groups;
    }, {});
  }, [template]);

  async function handleGenerateSchedule() {
    if (!template) return;

    setIsGenerating(true);
    setError('');

    try {
      const generatedSchedule = await generateWeeklySchedule(template.id);
      navigate(`/weekly-schedules/${generatedSchedule.id}`);
    } catch (error: any) {
      console.error('GENERATE WEEKLY SCHEDULE ERROR:', error);
      setError(
        error.response?.data?.message ?? 'Unable to generate weekly schedule.',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <main className="employees-page py-5">
        <p className="text-white">Loading template...</p>
      </main>
    );
  }

  if (error || !template) {
    return (
      <main className="employees-page py-5">
        <div className="alert alert-danger">
          {error || 'Template not found.'}
        </div>
      </main>
    );
  }

  return (
    <main className="employees-page py-5">
      <BackButton to="/templates" label="← Back to Templates" />

      <header className="mb-4">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h1 className="dashboard-menu-title mb-2">{template.name}</h1>
            <p className="text-white mb-0">Week start: {template.weekStart}</p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn moka-btn"
              onClick={() => setShowGrid((previous) => !previous)}
            >
              {showGrid ? 'Table View' : 'Grid View'}
            </button>

            <button
              type="button"
              className="btn moka-btn"
              onClick={handleGenerateSchedule}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {template.holidayWarnings.length > 0 && (
        <section className="alert alert-warning">
          <h2 className="h5">Holiday warnings</h2>

          <ul className="mb-0">
            {template.holidayWarnings.map((warning) => (
              <li key={`${warning.date}-${warning.holidayName}`}>
                {warning.date} - {warning.holidayName} ({warning.dayOfWeek}) —{' '}
                affected slots: {warning.affectedSlotsCount}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!showGrid && (
        <section className="card moka-soft-card shadow-sm">
          <div className="card-header moka-soft-card-header">
            <h2 className="h5 mb-0">Template slots</h2>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle moka-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Required skill</th>
                  <th>Pre-assignment</th>
                </tr>
              </thead>

              <tbody>
                {template.slots.map((slot, index) => (
                  <tr key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`}>
                    <td>{slot.day}</td>

                    <td>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </td>

                    <td>{slot.requiredSkill}</td>

                    <td>
                      {slot.employeeId ? (
                        <span className="badge text-bg-primary">
                          Employee #{slot.employeeId}
                        </span>
                      ) : (
                        <span className="badge text-bg-secondary">
                          Automatic
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showGrid && (
        <section className="mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <h2 className="dashboard-menu-title h4 mb-0">Template Grid</h2>

            <div className="btn-group">
              <button
                type="button"
                className="btn moka-btn"
                onClick={() => setZoomLevel('overview')}
              >
                Overview
              </button>

              <button
                type="button"
                className="btn moka-btn"
                onClick={() => setZoomLevel('comfortable')}
              >
                Normal
              </button>

              <button
                type="button"
                className="btn moka-btn"
                onClick={() => setZoomLevel('focus')}
              >
                Focus
              </button>
            </div>
          </div>

          <div className={`template-days-board template-days-board-${zoomLevel}`}>
            {DAY_ORDER.map((day) => {
              const daySlots = previewSlotsByDay[day] ?? [];

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
                      {day} — {resolveDate(template.weekStart, day)}
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
                          (_, index) => minMinute + index * SLOT_MINUTES,
                        ).map((minute) => (
                          <tr key={`${day}-${minute}`}>
                            <td className="fw-semibold">
                              {formatTimeWindow(minute)}
                            </td>

                            {columns.map((column) => {
                              const value = findCellValue(
                                daySlots,
                                minute,
                                column,
                                employees,
                              );

                              return (
                                <td
                                  key={`${day}-${minute}-${column.skill}-${column.laneIndex}`}
                                >
                                  {value ? (
                                    value !== column.skill ? (
                                      <span className="fw-semibold">
                                        {value}
                                      </span>
                                    ) : (
                                      <span className="badge text-bg-warning">
                                        {value}
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
      )}
    </main>
  );
}