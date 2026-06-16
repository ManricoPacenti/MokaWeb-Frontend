import { useMemo } from 'react';

import type { DayOfWeekValue, EmployeeSkillName } from '../../employees/types/employeeTypes';
import type { WeeklyScheduleAssignment } from '../types/weeklyScheduleTypes';

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

type WeeklyScheduleGridProps = {
  weekStart: string;
  assignments: WeeklyScheduleAssignment[];
  zoomLevel?: ScheduleZoomLevel;
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

export default function WeeklyScheduleGrid({
  weekStart,
  assignments,
  zoomLevel = 'comfortable',
}: WeeklyScheduleGridProps) {
  const assignmentsByDay = useMemo(() => {
    return DAY_ORDER.reduce<Record<string, AssignmentWithLane[]>>(
      (groups, day) => {
        const dayAssignments = assignments
          .filter((assignment) => assignment.day === day)
          .sort((a, b) => {
            const byStart = a.startTime.localeCompare(b.startTime);

            if (byStart !== 0) {
              return byStart;
            }

            return a.requiredSkill.localeCompare(b.requiredSkill);
          });

        groups[day] = assignLanes(dayAssignments);

        return groups;
      },
      {},
    );
  }, [assignments]);

  return (
    <div className={`template-days-board template-days-board-${zoomLevel}`}>
      {DAY_ORDER.map((day) => {
        const dayAssignments = assignmentsByDay[day] ?? [];

        if (dayAssignments.length === 0) {
          return null;
        }

        const columns = buildColumns(dayAssignments);
        const minMinute = Math.min(
          ...dayAssignments.map((assignment) => toMinute(assignment.startTime)),
        );
        const maxMinute = Math.max(...dayAssignments.map(normalizedEndMinute));

        return (
          <section
            key={day}
            className="card moka-soft-card shadow-sm template-day-card"
          >
            <div className="card-header moka-soft-card-header">
              <h2 className="h6 mb-0">
                {day} — {resolveDate(weekStart, day)}
              </h2>
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
                      <td className="fw-semibold">{formatTimeWindow(minute)}</td>

                      {columns.map((column) => {
                        const assignment = findCellAssignment(
                          dayAssignments,
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
  );
}