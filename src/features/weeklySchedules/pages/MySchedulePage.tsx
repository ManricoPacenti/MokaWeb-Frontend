import { useEffect, useMemo, useState } from 'react';

import { getPublishedWeeklySchedules } from '../api/weeklyScheduleService';
import WeeklyScheduleGrid from '../components/WeeklyScheduleGrid';
import type { WeeklySchedule } from '../types/weeklyScheduleTypes';

type ScheduleZoomLevel = 'overview' | 'comfortable' | 'focus';

export default function MySchedulePage() {
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [zoomLevel, setZoomLevel] = useState<ScheduleZoomLevel>('comfortable');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSchedules() {
      try {
        const data = await getPublishedWeeklySchedules();
        setSchedules(data);
      } catch (error) {
        console.error('LOAD MY SCHEDULE ERROR:', error);
        setError('Unable to load published schedules.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSchedules();
  }, []);

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) =>
      a.weekStart.localeCompare(b.weekStart),
    );
  }, [schedules]);

  if (isLoading) {
    return (
      <main className="employees-page py-5">
        <p className="text-white">Loading your schedules...</p>
      </main>
    );
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="dashboard-menu-title mb-2">My Schedule</h1>
            <p className="text-white mb-0">
              Published shifts shared by your manager.
            </p>
          </div>

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
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && sortedSchedules.length === 0 && (
        <div className="alert alert-warning">
          No published schedule is available yet.
        </div>
      )}

      {!error &&
        sortedSchedules.map((schedule) => (
          <section key={schedule.id} className="mb-5">
            <section className="card moka-soft-card shadow-sm mb-3">
              <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h2 className="h5 mb-1">Week of {schedule.weekStart}</h2>
                  <span className="badge text-bg-success">Published</span>
                </div>

                <p className="text-muted mb-0 small">
                  Assignments: {schedule.assignments.length}
                </p>
              </div>
            </section>

            <WeeklyScheduleGrid
              weekStart={schedule.weekStart}
              assignments={schedule.assignments}
              zoomLevel={zoomLevel}
            />
          </section>
        ))}
    </main>
  );
}