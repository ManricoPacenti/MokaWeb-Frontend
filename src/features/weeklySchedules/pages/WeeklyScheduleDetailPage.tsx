import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BackButton from '../../../components/BackButton';

import {
  getWeeklyScheduleById,
  publishWeeklySchedule,
  unpublishWeeklySchedule,
} from '../api/weeklyScheduleService';

import type {
  WeeklySchedule,
  WeeklyScheduleAssignment,
} from '../types/weeklyScheduleTypes';

import type {
  DayOfWeekValue,
  EmployeeSkillName,
} from '../../employees/types/employeeTypes';

/**
 * shows all the specific content of a schedule.
 * assignment
 * time grid
 * assigned slot
 * hours by employee
 */
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
const DEFAULT_EMPLOYEE_COLOR = '#6C757D';

type ScheduleZoomLevel = 'overview' | 'comfortable' | 'focus';

type SkillColumn = {
  skill: EmployeeSkillName;
  laneIndex: number;
};

type AssignmentWithLane = WeeklyScheduleAssignment & {
  laneIndex: number;
};

function toMinute(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function crossesMidnight(assignment: WeeklyScheduleAssignment): boolean {
  return toMinute(assignment.endTime) < toMinute(assignment.startTime);
}

function normalizedEndMinute(assignment: WeeklyScheduleAssignment): number {
  const end = toMinute(assignment.endTime);
  return crossesMidnight(assignment) ? end + 24 * 60 : end;
}

function durationMinutes(assignment: WeeklyScheduleAssignment): number {
  return normalizedEndMinute(assignment) - toMinute(assignment.startTime);
}

function overlaps(
  first: WeeklyScheduleAssignment,
  second: WeeklyScheduleAssignment,
): boolean {
  const firstStart = toMinute(first.startTime);
  const firstEnd = normalizedEndMinute(first);
  const secondStart = toMinute(second.startTime);
  const secondEnd = normalizedEndMinute(second);

  return firstStart < secondEnd && secondStart < firstEnd;
}

function containsMinute(
  assignment: WeeklyScheduleAssignment,
  minute: number,
): boolean {
  const start = toMinute(assignment.startTime);
  const end = normalizedEndMinute(assignment);

  return minute >= start && minute < end;
}

function formatMinute(minute: number): string {
  const normalized = minute % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatTimeWindow(minute: number): string {
  return `${formatMinute(minute)}-${formatMinute(minute + SLOT_MINUTES)}`;
}

function getEmployeeLabel(assignment: WeeklyScheduleAssignment): string {
  if (!assignment.assigned) {
    return assignment.requiredSkill;
  }

  const fullName = `${assignment.employeeFirstName ?? ''} ${
    assignment.employeeLastName ?? ''
  }`.trim();

  return fullName || `Employee #${assignment.employeeId}`;
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

function assignLanes(
  assignments: WeeklyScheduleAssignment[],
): AssignmentWithLane[] {
  const result: AssignmentWithLane[] = [];

  for (const assignment of assignments) {
    let laneIndex = 0;

    while (
      result.some(
        (existing) =>
          existing.requiredSkill === assignment.requiredSkill &&
          existing.laneIndex === laneIndex &&
          overlaps(existing, assignment),
      )
    ) {
      laneIndex += 1;
    }

    result.push({
      ...assignment,
      laneIndex,
    });
  }

  return result;
}

function buildColumns(assignments: AssignmentWithLane[]): SkillColumn[] {
  const skills = Array.from(
    new Set(assignments.map((assignment) => assignment.requiredSkill)),
  );

  return skills.flatMap((skill) => {
    const maxLane = Math.max(
      ...assignments
        .filter((assignment) => assignment.requiredSkill === skill)
        .map((assignment) => assignment.laneIndex),
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

function findCellAssignment(
  assignments: AssignmentWithLane[],
  minute: number,
  column: SkillColumn,
): AssignmentWithLane | undefined {
  return assignments.find(
    (currentAssignment) =>
      currentAssignment.requiredSkill === column.skill &&
      currentAssignment.laneIndex === column.laneIndex &&
      containsMinute(currentAssignment, minute),
  );
}

export default function WeeklyScheduleDetailPage() {
  const { id } = useParams();
  const scheduleId = Number(id);

  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ScheduleZoomLevel>('comfortable');

  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSchedule() {
      if (!scheduleId || Number.isNaN(scheduleId)) {
        setError('Invalid schedule ID.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getWeeklyScheduleById(scheduleId);
        setSchedule(data);
      } catch (error) {
        console.error('LOAD WEEKLY SCHEDULE ERROR:', error);
        setError('Unable to load weekly schedule.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSchedule();
  }, [scheduleId]);

  async function handleTogglePublished() {
    if (!schedule) return;

    setIsPublishing(true);
    setError('');

    try {
      const updatedSchedule = schedule.published
        ? await unpublishWeeklySchedule(schedule.id)
        : await publishWeeklySchedule(schedule.id);

      setSchedule(updatedSchedule);
    } catch (error) {
      console.error('UPDATE SCHEDULE PUBLISHED ERROR:', error);
      setError('Unable to update publication status.');
    } finally {
      setIsPublishing(false);
    }
  }

  const assignmentsByDay = useMemo(() => {
    if (!schedule) return {};

    return DAY_ORDER.reduce<Record<string, AssignmentWithLane[]>>(
      (groups, day) => {
        const dayAssignments = schedule.assignments
          .filter((assignment) => assignment.day === day)
          .sort((a, b) => {
            const byStart = a.startTime.localeCompare(b.startTime);
            if (byStart !== 0) return byStart;

            return a.requiredSkill.localeCompare(b.requiredSkill);
          });

        groups[day] = assignLanes(dayAssignments);
        return groups;
      },
      {},
    );
  }, [schedule]);

  /**
   * aggregates assigned working minutesby employee
   * to provide a workload summary for the selected week
   */
  const hoursSummary = useMemo(() => {
    if (!schedule) return [];

    const summary = new Map<
      number,
      {
        employeeId: number;
        employeeName: string;
        employeeDisplayColor: string | null;
        minutes: number;
      }
    >();

    for (const assignment of schedule.assignments) {
      if (!assignment.assigned || assignment.employeeId === null) {
        continue;
      }

      const current = summary.get(assignment.employeeId);

      summary.set(assignment.employeeId, {
        employeeId: assignment.employeeId,
        employeeName: getEmployeeLabel(assignment),
        employeeDisplayColor: assignment.employeeDisplayColor,
        minutes: (current?.minutes ?? 0) + durationMinutes(assignment),
      });
    }

    return Array.from(summary.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  }, [schedule]);

  if (isLoading) {
    return (
      <main className="employees-page py-5">
        <p className="text-white">Loading weekly schedule...</p>
      </main>
    );
  }

  if (error || !schedule) {
    return (
      <main className="employees-page py-5">
        <div className="alert alert-danger">
          {error || 'Weekly schedule not found.'}
        </div>
      </main>
    );
  }

  const assignedCount = schedule.assignments.filter(
    (assignment) => assignment.assigned,
  ).length;

  const unassignedCount = schedule.assignments.length - assignedCount;

  return (
    <main className="employees-page py-5">
      <BackButton
        to="/weekly-schedules"
        label="← Back to Weekly Schedules"
      />
      <header className="mb-4">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h1 className="dashboard-menu-title mb-2">
              Weekly Schedule #{schedule.id}
            </h1>

            <p className="text-white mb-2">
              Template #{schedule.templateId} — Week start {schedule.weekStart}
            </p>

            {schedule.published ? (
              <span className="badge text-bg-success">Published</span>
            ) : (
              <span className="badge text-bg-secondary">Unpublished</span>
            )}
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn moka-btn"
              onClick={handleTogglePublished}
              disabled={isPublishing}
            >
              {isPublishing
                ? 'Updating...'
                : schedule.published
                  ? 'Unpublish'
                  : 'Publish'}
            </button>

            <Link
              to={`/templates/${schedule.templateId}`}
              className="btn moka-btn"
            >
              Template Detail
            </Link>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card moka-soft-card shadow-sm">
            <div className="card-body">
              <h2 className="h6 text-muted">Total assignments</h2>
              <p className="display-6 mb-0">{schedule.assignments.length}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card moka-soft-card shadow-sm">
            <div className="card-body">
              <h2 className="h6 text-muted">Assigned</h2>
              <p className="display-6 mb-0">{assignedCount}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card moka-soft-card shadow-sm">
            <div className="card-body">
              <h2 className="h6 text-muted">Uncovered</h2>
              <p className="display-6 mb-0">{unassignedCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <h2 className="dashboard-menu-title h4 mb-0">Schedule Grid</h2>

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
            const assignments = assignmentsByDay[day] ?? [];

            if (assignments.length === 0) return null;

            const columns = buildColumns(assignments);
            const minMinute = Math.min(
              ...assignments.map((assignment) => toMinute(assignment.startTime)),
            );
            const maxMinute = Math.max(...assignments.map(normalizedEndMinute));

            return (
              <section
                key={day}
                className="card moka-soft-card shadow-sm template-day-card"
              >
                <div className="card-header moka-soft-card-header">
                  <h3 className="h6 mb-0">
                    {day} — {resolveDate(schedule.weekStart, day)}
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
                            const assignment = findCellAssignment(
                              assignments,
                              minute,
                              column,
                            );

                            return (
                              <td
                                key={`${day}-${minute}-${column.skill}-${column.laneIndex}`}
                              >
                                {assignment ? (
                                  !assignment.assigned ? (
                                    <span className="badge text-bg-warning">
                                      {assignment.requiredSkill}
                                    </span>
                                  ) : (
                                    <span
                                      className="fw-semibold px-2 py-1 rounded d-inline-block"
                                      style={{
                                        backgroundColor:
                                          assignment.employeeDisplayColor ??
                                          DEFAULT_EMPLOYEE_COLOR,
                                        color: '#fff',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                      }}
                                    >
                                      {getEmployeeLabel(assignment)}
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

      <section className="card moka-soft-card shadow-sm">
        <div className="card-header moka-soft-card-header">
          <h2 className="h5 mb-0">Hours Summary</h2>
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 moka-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Assigned hours</th>
              </tr>
            </thead>

            <tbody>
              {hoursSummary.map((employee) => (
                <tr key={employee.employeeId}>
                  <td>
                    <span
                      className="fw-semibold px-2 py-1 rounded d-inline-block"
                      style={{
                        backgroundColor:
                          employee.employeeDisplayColor ??
                          DEFAULT_EMPLOYEE_COLOR,
                        color: '#fff',
                        border: '1px solid rgba(0,0,0,0.15)',
                      }}
                    >
                      {employee.employeeName}
                    </span>
                  </td>

                  <td>{(employee.minutes / 60).toFixed(1)}h</td>
                </tr>
              ))}

              {hoursSummary.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-muted">
                    No assigned employees.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}