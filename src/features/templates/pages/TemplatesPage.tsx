import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { deleteTemplate, getTemplates } from '../api/templateService';
import type { WeeklyScheduleTemplate } from '../types/templateTypes';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WeeklyScheduleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('LOAD TEMPLATES ERROR:', error);
        setError('Unable to load templates.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  async function handleDeleteTemplate(template: WeeklyScheduleTemplate) {
    const confirmed = window.confirm(
      `Do you want to delete template "${template.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(template.id);
    setError('');

    try {
      await deleteTemplate(template.id);

      setTemplates((previousTemplates) =>
        previousTemplates.filter(
          (currentTemplate) => currentTemplate.id !== template.id,
        ),
      );
    } catch (error) {
      console.error('DELETE TEMPLATE ERROR:', error);
      setError(
        'Unable to delete this template. Delete linked weekly schedules first.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="employees-page py-5">
      <header className="mb-4">
        <h1 className="dashboard-menu-title mb-3">Schedule Templates</h1>

        <div className="d-flex gap-2 flex-wrap">
          <Link to="/templates/new" className="btn moka-btn">
            + New Template
          </Link>

          <Link to="/weekly-schedules" className="btn moka-btn">
            Saved Weekly Schedules
          </Link>
        </div>
      </header>

      {isLoading && <p className="text-white">Loading templates...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && !error && templates.length === 0 && (
        <div className="alert alert-warning">No templates found.</div>
      )}

      {!isLoading && !error && templates.length > 0 && (
        <section className="card moka-soft-card shadow-sm">
          <div className="card-header moka-soft-card-header">
            <h2 className="h5 mb-0">Template list</h2>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle moka-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Week Start</th>
                  <th>Slots</th>
                  <th>Holiday Warnings</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {templates.map((template) => {
                  const isDeleting = deletingId === template.id;

                  return (
                    <tr key={template.id}>
                      <td>{template.id}</td>
                      <td className="fw-semibold">{template.name}</td>
                      <td>{template.weekStart}</td>
                      <td>{template.slots.length}</td>
                      <td>{template.holidayWarnings.length}</td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <Link
                            to={`/templates/${template.id}`}
                            className="btn btn-sm moka-btn"
                          >
                            Detail
                          </Link>

                          <button
                            type="button"
                            className="btn btn-sm moka-btn"
                            onClick={() => handleDeleteTemplate(template)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
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