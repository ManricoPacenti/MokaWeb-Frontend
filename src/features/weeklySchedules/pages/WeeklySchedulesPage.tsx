import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getTemplates } from '../../templates/api/templateService';
import type { WeeklyScheduleTemplate } from '../../templates/types/templateTypes';
import {
  deleteWeeklySchedule,
  getWeeklySchedules,
  publishWeeklySchedule,
  unpublishWeeklySchedule,
} from '../api/weeklyScheduleService';

import type { WeeklySchedule } from '../types/weeklyScheduleTypes';

/**
 * show all the generated schedules
 * with operation like publish or delete
 */
export default function WeeklySchedulesPage() {
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [templates, setTemplates] = useState<WeeklyScheduleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const templatesById = useMemo<Record<number, WeeklyScheduleTemplate>>(() => {
    return Object.fromEntries(
      templates.map((template) => [template.id, template]),
    );
  }, [templates]);

  const publishedCount = schedules.filter(
    (schedule) => schedule.published,
  ).length;

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    try {
      setError('');

      const [schedulesData, templatesData] = await Promise.all([
        getWeeklySchedules(),
        getTemplates(),
      ]);

      setSchedules(schedulesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('LOAD WEEKLY SCHEDULES ERROR:', error);
      setError('Unable to load saved weekly schedules.');
    } finally {
      setIsLoading(false);
    }
  }

  function getTemplateName(templateId: number): string {
    return templatesById[templateId]?.name ?? `Missing template #${templateId}`;
  }

  async function handleTogglePublished(schedule: WeeklySchedule) {
    setUpdatingId(schedule.id);
    setError('');

    try {
      const updated = schedule.published
        ? await unpublishWeeklySchedule(schedule.id)
        : await publishWeeklySchedule(schedule.id);

      setSchedules((previousSchedules) =>
        previousSchedules.map((currentSchedule) =>
          currentSchedule.id === updated.id ? updated : currentSchedule,
        ),
      );
    } catch (error) {
      console.error('UPDATE SCHEDULE PUBLISHED ERROR:', error);
      setError('Unable to update publication status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(schedule: WeeklySchedule) {
    const confirmed = window.confirm(
      `Do you want to delete the saved schedule for week ${schedule.weekStart}?`,
    );

    if (!confirmed) return;

    setUpdatingId(schedule.id);
    setError('');

    try {
      await deleteWeeklySchedule(schedule.id);

      setSchedules((previousSchedules) =>
        previousSchedules.filter(
          (currentSchedule) => currentSchedule.id !== schedule.id,
        ),
      );
    } catch (error) {
      console.error('DELETE WEEKLY SCHEDULE ERROR:', error);
      setError('Unable to delete saved weekly schedule.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Saved Weekly Schedules</h1>

        <section className="card moka-soft-card shadow-sm p-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="h6 mb-1">Publication overview</h2>
              <p className="text-muted mb-0 small">
                Total: {schedules.length} — Published: {publishedCount} —
                Unpublished: {schedules.length - publishedCount}
              </p>
            </div>

            <Link to="/templates" className="btn moka-btn">
              Schedule Templates
            </Link>
          </div>
        </section>
      </header>

      {isLoading && <p className="text-white">Loading saved schedules...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && !error && schedules.length === 0 && (
        <div className="alert alert-warning">
          No generated weekly schedules found.
        </div>
      )}

      {!isLoading && !error && schedules.length > 0 && (
        <section className="card moka-soft-card shadow-sm">
          <div className="card-header moka-soft-card-header">
            <h2 className="h5 mb-0">Schedule list</h2>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle moka-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Template</th>
                  <th>Week Start</th>
                  <th>Assignments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((schedule) => {
                  const isUpdating = updatingId === schedule.id;

                  return (
                    <tr key={schedule.id}>
                      <td>{schedule.id}</td>

                      <td className="fw-semibold">
                        {getTemplateName(schedule.templateId)}
                      </td>

                      <td>{schedule.weekStart}</td>

                      <td>{schedule.assignments.length}</td>

                      <td>
                        {schedule.published ? (
                          <span className="badge text-bg-success">
                            Published
                          </span>
                        ) : (
                          <span className="badge text-bg-secondary">
                            Unpublished
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <Link
                            to={`/weekly-schedules/${schedule.id}`}
                            className="btn btn-sm moka-btn"
                          >
                            Detail
                          </Link>

                          <button
                            type="button"
                            className="btn btn-sm moka-btn"
                            onClick={() => handleTogglePublished(schedule)}
                            disabled={isUpdating}
                          >
                            {isUpdating
                              ? 'Updating...'
                              : schedule.published
                                ? 'Unpublish'
                                : 'Publish'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm moka-btn"
                            onClick={() => handleDelete(schedule)}
                            disabled={isUpdating}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}